import datetime

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.consultations.models import ConsultationRequest
from apps.orders.models import Order, Prescription


class AdminSmokeTests(TestCase):
    """Every admin changelist, add and change page renders, and the consultation workflow buttons work."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed", "--demo", verbosity=0)
        cls.user = get_user_model().objects.create_superuser("admin", "admin@example.com", "pass12345")
        Appointment.objects.create(
            name="A", phone="+919876543210", reason="Test",
            date=timezone.localdate() + datetime.timedelta(days=2), time=datetime.time(10, 0),
        )
        ConsultationRequest.objects.create(
            name="C", phone="+919876543210", issues=["dry_eyes"], issue_description="Dry eyes for a week now."
        )
        Order.objects.create(customer_name="O", phone="+919876543210")
        Prescription.objects.create(patient_name="P", right_sph=-1, left_sph=-1.25, right_add=1.5)

    def setUp(self):
        self.client.force_login(self.user)

    def test_all_admin_pages_render(self):
        for model, model_admin in admin.site._registry.items():
            meta = model._meta
            name = f"admin:{meta.app_label}_{meta.model_name}"
            resp = self.client.get(reverse(f"{name}_changelist"), follow=True)
            self.assertEqual(resp.status_code, 200, f"{name} changelist")
            if model_admin.has_add_permission(resp.wsgi_request):
                self.assertEqual(self.client.get(reverse(f"{name}_add")).status_code, 200, f"{name} add")
            obj = model.objects.first()
            if obj is not None:
                resp = self.client.get(reverse(f"{name}_change", args=[obj.pk]))
                self.assertEqual(resp.status_code, 200, f"{name} change")

    def test_consultation_buttons_post_only(self):
        c = ConsultationRequest.objects.get()
        url = reverse("admin:consultation-reject", args=[c.pk])
        self.assertEqual(self.client.get(url).status_code, 405)
        self.client.post(url)
        c.refresh_from_db()
        self.assertEqual(c.status, "rejected")
        self.assertIsNotNone(c.rejected_at)

    def test_manual_meet_link_approval(self):
        c = ConsultationRequest.objects.get()
        c.meet_link = "https://meet.google.com/abc-defg-hij"
        c.save()
        self.client.post(reverse("admin:consultation-approve", args=[c.pk]))
        c.refresh_from_db()
        self.assertEqual(c.status, "approved")
        page = self.client.get(reverse("admin:consultations_consultationrequest_change", args=[c.pk])).content.decode()
        self.assertIn("wa.me/919876543210", page)
