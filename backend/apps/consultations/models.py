import uuid

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.core.utils import RandomUploadPath


class ConsultationRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"

    class Issue(models.TextChoices):
        RED_EYES = "red_eyes", "Red eyes"
        DRY_EYES = "dry_eyes", "Dry eyes"
        ITCHING = "itching", "Itching"
        IRRITATION = "irritation", "Irritation"
        LENS_DISCOMFORT = "lens_discomfort", "Lens discomfort"
        OTHER = "other", "Something else"

    class Since(models.TextChoices):
        TODAY = "today", "Today"
        FEW_DAYS = "few_days", "2 to 3 days"
        WEEK = "week", "About a week"
        LONGER = "longer", "Longer"

    class Eye(models.TextChoices):
        BOTH = "both", "Both"
        RIGHT = "right", "Right"
        LEFT = "left", "Left"

    class PreferredTime(models.TextChoices):
        TODAY_EVENING = "today_evening", "Today, evening (5 to 8 pm)"
        TOMORROW_MORNING = "tomorrow_morning", "Tomorrow, morning"
        TOMORROW_EVENING = "tomorrow_evening", "Tomorrow, evening"
        ANY = "any", "Any time"

    class Channel(models.TextChoices):
        EMAIL = "email", "Email"
        WHATSAPP = "whatsapp", "WhatsApp"
        BOTH = "both", "Email & WhatsApp"

    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="consultations"
    )
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    issues = models.JSONField(default=list, help_text="List of issue codes.")
    since = models.CharField(max_length=10, choices=Since.choices, default=Since.FEW_DAYS)
    eye = models.CharField(max_length=6, choices=Eye.choices, default=Eye.BOTH)
    preferred_time = models.CharField(max_length=20, choices=PreferredTime.choices, default=PreferredTime.ANY)
    issue_description = models.TextField(max_length=1000)

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    scheduled_for = models.DateTimeField(null=True, blank=True, help_text="When the video call will happen.")
    meet_link = models.URLField(blank=True)
    google_event_id = models.CharField(max_length=255, blank=True)
    link_sent_via = models.CharField(max_length=10, choices=Channel.choices, blank=True)
    patient_notes = models.TextField(
        blank=True, help_text="Advice from the call. The patient sees this once the consultation is completed."
    )
    doctor_notes = models.TextField(blank=True, help_text="Internal notes, never shown to the patient.")
    rejection_reason = models.CharField(
        max_length=300, blank=True, help_text="Shown to the patient (and emailed) if rejected."
    )

    approved_at = models.DateTimeField(null=True, blank=True)
    link_sent_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.issues_display} ({self.get_status_display()})"

    @property
    def issues_display(self):
        labels = dict(self.Issue.choices)
        return ", ".join(labels.get(i, i) for i in self.issues) or "—"


class ConsultationPhoto(models.Model):
    MAX_PER_REQUEST = 3

    consultation = models.ForeignKey(ConsultationRequest, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to=RandomUploadPath("consultations"))

    def __str__(self):
        return f"Photo for {self.consultation}"
