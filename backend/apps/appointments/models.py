from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.core.models import TimeStampedModel


class Appointment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    # Statuses that occupy a slot. Cancelled bookings free it up again.
    ACTIVE_STATUSES = (Status.PENDING, Status.APPROVED, Status.COMPLETED)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="appointments"
    )
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    for_whom = models.CharField(max_length=40, default="Myself", help_text="Who the test is for.")
    reason = models.CharField(max_length=120)
    notes = models.TextField(max_length=1000, blank=True, help_text="Anything the patient wants us to know.")
    date = models.DateField()
    time = models.TimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=30)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    admin_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-date", "-time"]
        constraints = [
            # Database-level guarantee against double booking, even under concurrent requests.
            models.UniqueConstraint(
                fields=["date", "time"],
                condition=Q(status__in=["pending", "approved", "completed"]),
                name="unique_active_appointment_slot",
            )
        ]
        indexes = [models.Index(fields=["date", "status"])]

    def __str__(self):
        return f"{self.name} — {self.date:%d %b %Y} {self.time:%H:%M}"


class BlockedSlot(models.Model):
    """Block a whole day (leave times empty) or a time range, e.g. holidays or doctor leave."""

    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        if self.is_full_day:
            return f"{self.date:%d %b %Y} (full day) {self.reason}".strip()
        return f"{self.date:%d %b %Y} {self.start_time:%H:%M}–{self.end_time:%H:%M} {self.reason}".strip()

    @property
    def is_full_day(self):
        return self.start_time is None and self.end_time is None

    def clean(self):
        if (self.start_time is None) != (self.end_time is None):
            raise ValidationError("Set both start and end time, or leave both empty to block the full day.")
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")
