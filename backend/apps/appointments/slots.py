"""Slot generation and validation, shared by the API and admin."""
import datetime

from django.utils import timezone

from apps.core.models import BusinessHours, ClinicSettings

from .models import Appointment, BlockedSlot


def _combine(date, time):
    return timezone.make_aware(datetime.datetime.combine(date, time))


def bookable_date_range(settings_obj=None):
    s = settings_obj or ClinicSettings.load()
    today = timezone.localdate()
    return today, today + datetime.timedelta(days=s.booking_window_days)


def generate_slots(date, settings_obj=None):
    """Return a list of ``{"time": time, "available": bool}`` for the given date.

    Slots run from opening time, every ``slot_duration_minutes``, and must end by closing time.
    """
    s = settings_obj or ClinicSettings.load()
    first_day, last_day = bookable_date_range(s)
    if date < first_day or date > last_day:
        return []

    hours = BusinessHours.for_weekday(date.weekday())
    if hours is None:
        return []
    open_time, close_time = hours

    blocks = list(BlockedSlot.objects.filter(date=date))
    if any(b.is_full_day for b in blocks):
        return []

    taken = set(
        Appointment.objects.filter(date=date, status__in=Appointment.ACTIVE_STATUSES).values_list("time", flat=True)
    )
    step = datetime.timedelta(minutes=s.slot_duration_minutes)
    earliest = timezone.localtime() + datetime.timedelta(minutes=s.min_notice_minutes)

    slots = []
    start = _combine(date, open_time)
    end_of_day = _combine(date, close_time)
    while start + step <= end_of_day:
        slot_time = timezone.localtime(start).time()
        slot_end = timezone.localtime(start + step).time()
        blocked = any(b.start_time < slot_end and slot_time < b.end_time for b in blocks)
        available = not blocked and slot_time not in taken and start >= earliest
        slots.append({"time": slot_time, "available": available})
        start += step
    return slots


def validate_slot(date, time, settings_obj=None):
    """Return an error message if the slot can't be booked, else None."""
    s = settings_obj or ClinicSettings.load()
    first_day, last_day = bookable_date_range(s)
    if date < first_day:
        return "Please choose a date in the future."
    if date > last_day:
        return f"Appointments can be booked up to {s.booking_window_days} days ahead."
    slots = generate_slots(date, s)
    if not slots:
        return "The clinic is closed on this date."
    match = next((slot for slot in slots if slot["time"] == time), None)
    if match is None:
        return "Please choose one of the listed time slots."
    if not match["available"]:
        return "This slot is no longer available. Please pick another time."
    return None
