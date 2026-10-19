import datetime

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ClinicSettings(models.Model):
    """Singleton holding store info and booking configuration, editable in admin."""

    SLOT_CHOICES = [(15, "15 minutes"), (30, "30 minutes"), (45, "45 minutes"), (60, "60 minutes")]

    name = models.CharField(max_length=120, default="Pareena Eye Care Center")
    tagline = models.CharField(max_length=200, default="Clear vision, personal care.")
    description = models.TextField(
        default=(
            "Pareena Eye Care Center is a neighbourhood optical store and optometry clinic "
            "offering comprehensive eye testing, branded frames and sunglasses, and contact lenses."
        )
    )
    philosophy = models.TextField(
        default=(
            "We believe every patient deserves unhurried, honest eye care. We test thoroughly, "
            "explain clearly, and only recommend what you genuinely need."
        )
    )
    address = models.TextField(
        default="Shop no. 1, #8-3-903/3, Omega Apartments, Nagarjuna Nagar, Ameerpet, Hyderabad"
    )
    phone = models.CharField(max_length=20, default="+91 99630 06059")
    whatsapp_number = models.CharField(
        max_length=20, default="919963006059", blank=True, help_text="Digits with country code, e.g. 919876543210"
    )
    email = models.EmailField(default="pareenaeyecare@gmail.com", blank=True)
    google_maps_embed_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="Google Maps → Share → Embed a map → copy only the src URL.",
    )
    google_maps_link = models.URLField(max_length=500, blank=True)

    slot_duration_minutes = models.PositiveSmallIntegerField(choices=SLOT_CHOICES, default=30)
    booking_window_days = models.PositiveSmallIntegerField(
        default=30,
        validators=[MinValueValidator(1), MaxValueValidator(180)],
        help_text="How many days ahead patients can book.",
    )
    min_notice_minutes = models.PositiveSmallIntegerField(
        default=60, help_text="Earliest a same-day slot can be booked, in minutes from now."
    )
    consultations_enabled = models.BooleanField(default=True)
    online_payments_enabled = models.BooleanField(
        default=True, help_text="Only takes effect when Razorpay keys are configured."
    )

    class Meta:
        verbose_name = "Clinic settings"
        verbose_name_plural = "Clinic settings"

    def __str__(self):
        return "Clinic settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class BusinessHours(models.Model):
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY = range(7)
    WEEKDAYS = [
        (MONDAY, "Monday"),
        (TUESDAY, "Tuesday"),
        (WEDNESDAY, "Wednesday"),
        (THURSDAY, "Thursday"),
        (FRIDAY, "Friday"),
        (SATURDAY, "Saturday"),
        (SUNDAY, "Sunday"),
    ]
    # Defaults: Mon–Sat 10:00–21:00, Sun 11:00–20:00
    DEFAULTS = {
        **{d: (datetime.time(10, 0), datetime.time(21, 0)) for d in range(6)},
        SUNDAY: (datetime.time(11, 0), datetime.time(20, 0)),
    }

    weekday = models.PositiveSmallIntegerField(choices=WEEKDAYS, unique=True)
    open_time = models.TimeField()
    close_time = models.TimeField()
    is_closed = models.BooleanField(default=False)

    class Meta:
        ordering = ["weekday"]
        verbose_name_plural = "Business hours"

    def __str__(self):
        if self.is_closed:
            return f"{self.get_weekday_display()}: closed"
        return f"{self.get_weekday_display()}: {self.open_time:%H:%M}–{self.close_time:%H:%M}"

    def clean(self):
        if not self.is_closed and self.open_time >= self.close_time:
            raise ValidationError("Closing time must be after opening time.")

    @classmethod
    def for_weekday(cls, weekday):
        """Return (open, close) for a weekday, or None if closed."""
        row = cls.objects.filter(weekday=weekday).first()
        if row is None:
            return cls.DEFAULTS[weekday]
        if row.is_closed:
            return None
        return row.open_time, row.close_time


class Optometrist(models.Model):
    name = models.CharField(max_length=120)
    photo = models.ImageField(upload_to="team/", blank=True)
    qualifications = models.CharField(max_length=255, help_text="e.g. B.Optom, M.Optom")
    experience_years = models.PositiveSmallIntegerField(default=0)
    specialization = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.name


class Testimonial(models.Model):
    patient_name = models.CharField(max_length=80)
    quote = models.TextField(max_length=600)
    rating = models.PositiveSmallIntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    is_published = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "-id"]

    def __str__(self):
        return f"{self.patient_name} ({self.rating}★)"


class StoreImage(models.Model):
    image = models.ImageField(upload_to="store/")
    caption = models.CharField(max_length=140, blank=True)
    show_on_home = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.caption or f"Store image #{self.pk}"
