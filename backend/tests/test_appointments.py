import datetime
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.appointments.models import Appointment, BlockedSlot
from apps.core.models import BusinessHours

URL = "/api/v1/appointments/"


def next_weekday(weekday):
    today = timezone.localdate()
    days = (weekday - today.weekday()) % 7 or 7
    return today + datetime.timedelta(days=days)


class AppointmentTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.monday = next_weekday(BusinessHours.MONDAY)
        self.sunday = next_weekday(BusinessHours.SUNDAY)

    def book(self, **overrides):
        data = {
            "name": "Asha Patel",
            "phone": "98765 43210",
            "reason": "Routine eye test",
            "date": self.monday.isoformat(),
            "time": "10:30",
            **overrides,
        }
        return self.client.post(URL, data, format="json")

    def test_slots_follow_operating_hours(self):
        monday = self.client.get(f"{URL}slots/", {"date": self.monday.isoformat()}).json()
        times = [s["time"] for s in monday["slots"]]
        self.assertEqual(times[0], "10:00")
        self.assertEqual(times[-1], "20:30")  # last 30-min slot ends at 21:00
        self.assertEqual(len(times), 22)

        sunday = self.client.get(f"{URL}slots/", {"date": self.sunday.isoformat()}).json()
        times = [s["time"] for s in sunday["slots"]]
        self.assertEqual((times[0], times[-1]), ("11:00", "19:30"))

    def test_booking_succeeds_and_normalises_phone(self):
        resp = self.book(name="<b>Asha</b> Patel")
        self.assertEqual(resp.status_code, 201, resp.content)
        appt = Appointment.objects.get()
        self.assertEqual(appt.phone, "+919876543210")
        self.assertEqual(appt.name, "Asha Patel")  # HTML stripped
        self.assertEqual(appt.status, "pending")

    def test_double_booking_rejected(self):
        self.assertEqual(self.book().status_code, 201)
        resp = self.book(name="Someone Else", phone="9123456780")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("time", resp.json())
        slots = self.client.get(f"{URL}slots/", {"date": self.monday.isoformat()}).json()["slots"]
        self.assertFalse(next(s for s in slots if s["time"] == "10:30")["available"])

    def test_cancelled_booking_frees_slot(self):
        self.book()
        Appointment.objects.update(status=Appointment.Status.CANCELLED)
        self.assertEqual(self.book(phone="9123456780").status_code, 201)

    def test_db_constraint_catches_race(self):
        """Even if validation is bypassed, the DB constraint prevents a duplicate slot."""
        self.book()
        with mock.patch("apps.appointments.serializers.validate_slot", return_value=None):
            resp = self.book(phone="9123456780")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_rejects_off_grid_time_and_outside_hours(self):
        self.assertEqual(self.book(time="10:15").status_code, 400)
        self.assertEqual(self.book(time="21:00").status_code, 400)
        self.assertEqual(self.book(date=self.sunday.isoformat(), time="10:00").status_code, 400)

    def test_rejects_past_and_too_far_dates(self):
        past = timezone.localdate() - datetime.timedelta(days=1)
        self.assertEqual(self.book(date=past.isoformat()).status_code, 400)
        far = timezone.localdate() + datetime.timedelta(days=90)
        self.assertEqual(self.book(date=far.isoformat()).status_code, 400)

    def test_blocked_slots(self):
        BlockedSlot.objects.create(date=self.monday, start_time=datetime.time(10, 0), end_time=datetime.time(11, 0))
        self.assertEqual(self.book(time="10:30").status_code, 400)
        self.assertEqual(self.book(time="11:00").status_code, 201)
        BlockedSlot.objects.create(date=self.sunday, reason="Holiday")
        cal = self.client.get(f"{URL}calendar/").json()
        self.assertIn(self.sunday.isoformat(), cal["closed_dates"])

    def test_invalid_phone(self):
        self.assertEqual(self.book(phone="12345").status_code, 400)

    def test_list_requires_auth(self):
        self.assertEqual(self.client.get(URL).status_code, 401)
