import io
import tempfile
from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
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


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="pareena-test-media-"))
class ConsultationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def submit(self, **extra):
        data = {
            "name": "Ravi Kumar",
            "phone": "9876543210",
            "issues": ["red_eyes", "itching"],
            "since": "few_days",
            "eye": "right",
            "preferred_time": "today_evening",
            "issue_description": "My right eye has been red since Saturday and feels gritty.",
            **extra,
        }
        return self.client.post(URL, data, format="multipart")

    def test_submit_with_photos(self):
        resp = self.submit(photos=[png_file("a.png"), png_file("b.png")])
        self.assertEqual(resp.status_code, 201, resp.content)
        c = ConsultationRequest.objects.get()
        self.assertEqual(c.issues, ["red_eyes", "itching"])
        self.assertEqual(c.photos.count(), 2)
        name = c.photos.first().image.name
        self.assertTrue(name.startswith("consultations/"))
        self.assertNotIn("a.png", name)  # randomised filename

    def test_validation(self):
        self.assertEqual(self.submit(issues=[]).status_code, 400)
        self.assertEqual(self.submit(issues=["not_an_issue"]).status_code, 400)
        self.assertEqual(self.submit(issue_description="too short").status_code, 400)
        too_many = [png_file(f"{i}.png") for i in range(4)]
        self.assertEqual(self.submit(photos=too_many).status_code, 400)
        fake = SimpleUploadedFile("x.png", b"not an image", content_type="image/png")
        self.assertEqual(self.submit(photos=[fake]).status_code, 400)

    def test_status_reveals_fields_by_stage(self):
        ref = self.submit().json()["reference"]
        c = ConsultationRequest.objects.get()
        c.meet_link, c.patient_notes = MEET, "Use lubricating drops 4 times a day."
        c.save()
        data = self.client.get(f"{URL}{ref}/").json()
        self.assertIsNone(data["meet_link"])
        self.assertIsNone(data["patient_notes"])

        services.approve(c, generate_link=False)
        data = self.client.get(f"{URL}{ref}/").json()
        self.assertEqual((data["status"], data["meet_link"]), ("approved", MEET))

        services.complete(c)
        data = self.client.get(f"{URL}{ref}/").json()
        self.assertIsNone(data["meet_link"])
        self.assertEqual(data["patient_notes"], "Use lubricating drops 4 times a day.")

    def test_lookup_several_references(self):
        refs = [self.submit().json()["reference"] for _ in range(2)]
        resp = self.client.get(f"{URL}lookup/", {"refs": ",".join(refs + ["not-a-uuid"])})
        self.assertEqual(sorted(r["reference"] for r in resp.json()), sorted(refs))

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
