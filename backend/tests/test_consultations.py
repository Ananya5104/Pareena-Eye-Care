import io
from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.consultations import services
from apps.consultations.meet import MeetLinkError
from apps.consultations.models import ConsultationRequest

URL = "/api/v1/consultations/"
MEET = "https://meet.google.com/abc-defg-hij"


def png_file(name="eye.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "red").save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


class ConsultationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def submit(self, **extra):
        data = {
            "name": "Ravi Kumar",
            "phone": "9876543210",
            "issue_type": "red_eyes",
            "issue_description": "Both eyes red and watery since yesterday.",
            **extra,
        }
        return self.client.post(URL, data, format="multipart")

    def test_submit_with_image(self):
        resp = self.submit(image=png_file())
        self.assertEqual(resp.status_code, 201, resp.content)
        c = ConsultationRequest.objects.get()
        self.assertEqual(c.status, "pending")
        self.assertTrue(c.image.name.startswith("consultations/"))
        self.assertNotIn("eye", c.image.name.split("/")[-1])  # randomised filename

    def test_rejects_non_image_upload(self):
        fake = SimpleUploadedFile("x.png", b"not an image", content_type="image/png")
        self.assertEqual(self.submit(image=fake).status_code, 400)

    def test_status_hides_link_until_approved(self):
        ref = self.submit().json()["reference"]
        c = ConsultationRequest.objects.get()
        c.meet_link = MEET
        c.save()
        self.assertIsNone(self.client.get(f"{URL}{ref}/").json()["meet_link"])
        services.approve(c, generate_link=False)
        data = self.client.get(f"{URL}{ref}/").json()
        self.assertEqual(data["status"], "approved")
        self.assertEqual(data["meet_link"], MEET)

    def test_approve_without_link_or_google_config_fails(self):
        self.submit()
        with self.assertRaises(MeetLinkError):
            services.approve(ConsultationRequest.objects.get())

    def test_approve_generates_link_when_google_configured(self):
        self.submit(email="ravi@example.com")
        c = ConsultationRequest.objects.get()
        with mock.patch("apps.consultations.meet.create_meet_link", return_value=(MEET, "evt1")):
            services.approve(c)
        c.refresh_from_db()
        self.assertEqual((c.meet_link, c.google_event_id, c.status), (MEET, "evt1", "approved"))
        self.assertIsNotNone(c.approved_at)
        self.assertEqual(c.link_sent_via, "both")

    def test_whatsapp_link_contains_meet_url(self):
        self.submit()
        c = ConsultationRequest.objects.get()
        c.meet_link = MEET
        link = services.patient_whatsapp_link(c)
        self.assertTrue(link.startswith("https://wa.me/919876543210?text="))
        self.assertIn("meet.google.com", link)

    def test_rate_limited(self):
        with mock.patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"consultations": "2/hour"}):
            codes = [self.submit().status_code for _ in range(3)]
        self.assertEqual(codes, [201, 201, 429])
