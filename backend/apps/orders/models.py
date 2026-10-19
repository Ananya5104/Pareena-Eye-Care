import secrets
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone

from apps.catalog.models import LensType, Product, ProductVariant
from apps.core.models import TimeStampedModel
from apps.core.utils import RandomUploadPath


def _power_field(min_value, max_value, **kwargs):
    return models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal(min_value)), MaxValueValidator(Decimal(max_value))],
        **kwargs,
    )


def _fmt(v):
    if v is None:
        return ""
    return "0.00" if v == 0 else f"{'+' if v > 0 else '−'}{abs(v):.2f}"


class Prescription(TimeStampedModel):
    """Eyesight prescription entered before choosing lenses.

    SPH = spherical power (the main "eye power"), CYL = cylindrical power, AXIS = cylinder axis,
    ADD = reading addition (needed for progressive lenses).
    """

    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="prescriptions"
    )
    patient_name = models.CharField(max_length=120, help_text="Whose prescription this is.")
    prescription_date = models.CharField(max_length=40, blank=True, help_text="Date written on the prescription.")

    right_sph = _power_field("-20", "20")
    right_cyl = _power_field("-6", "6", default=0)
    right_axis = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MaxValueValidator(180)])
    right_add = _power_field("0", "4", null=True, blank=True)
    left_sph = _power_field("-20", "20")
    left_cyl = _power_field("-6", "6", default=0)
    left_axis = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MaxValueValidator(180)])
    left_add = _power_field("0", "4", null=True, blank=True)
    pupillary_distance = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal("40")), MaxValueValidator(Decimal("80"))],
    )
    upload = models.FileField(
        upload_to=RandomUploadPath("prescriptions"), blank=True, help_text="Photo or PDF of the paper prescription."
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient_name}: {self.summary}"

    @property
    def has_add(self):
        return bool(self.right_add or self.left_add)

    @property
    def summary(self):
        def eye(sph, cyl, axis):
            out = _fmt(sph)
            if cyl:
                out += f" / {_fmt(cyl)} × {axis}"
            return out

        text = f"R {eye(self.right_sph, self.right_cyl, self.right_axis)} · L {eye(self.left_sph, self.left_cyl, self.left_axis)}"
        if self.has_add:
            text += f" · ADD {_fmt(self.right_add or self.left_add)}"
        return text


def generate_order_number():
    return f"PEC-{timezone.localdate():%y%m%d}-{secrets.token_hex(3).upper()}"


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PLACED = "placed", "Placed"
        CONFIRMED = "confirmed", "Confirmed"
        IN_PROGRESS = "in_progress", "In the lab"
        READY = "ready", "Ready to collect"
        COMPLETED = "completed", "Collected"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        ONLINE = "online", "Pay online"
        STORE = "store", "Pay at store"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    order_number = models.CharField(max_length=20, unique=True, default=generate_order_number, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders"
    )
    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    notes = models.CharField(max_length=500, blank=True)

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PLACED, db_index=True)
    payment_method = models.CharField(max_length=8, choices=PaymentMethod.choices, default=PaymentMethod.STORE)
    payment_status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    razorpay_order_id = models.CharField(max_length=60, blank=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=60, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    stock_released = models.BooleanField(default=False, editable=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    @property
    def awaiting_online_payment(self):
        return (
            self.payment_method == self.PaymentMethod.ONLINE
            and self.payment_status != self.PaymentStatus.PAID
            and self.status != self.Status.CANCELLED
        )

    @transaction.atomic
    def cancel(self):
        """Cancel the order and put reserved stock back (only once)."""
        if not self.stock_released:
            for item in self.items.all():
                ProductVariant.objects.filter(pk=item.variant_id).update(stock=F("stock") + item.quantity)
            self.stock_released = True
        self.status = self.Status.CANCELLED
        self.save(update_fields=["status", "stock_released", "updated_at"])

    def mark_paid(self, payment_id):
        self.payment_status = self.PaymentStatus.PAID
        self.razorpay_payment_id = payment_id
        self.paid_at = timezone.now()
        if self.status == self.Status.PLACED:
            self.status = self.Status.CONFIRMED
        self.save(update_fields=["payment_status", "razorpay_payment_id", "paid_at", "status", "updated_at"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="order_items")
    lens_type = models.ForeignKey(
        LensType, null=True, blank=True, on_delete=models.PROTECT, related_name="order_items"
    )
    prescription = models.ForeignKey(
        Prescription, null=True, blank=True, on_delete=models.SET_NULL, related_name="order_items",
        help_text="Empty with a lens type means plain (zero-power) lenses.",
    )
    # Snapshots, so the order stays accurate if the catalogue changes later.
    product_name = models.CharField(max_length=200)
    color_name = models.CharField(max_length=60)
    lens_name = models.CharField(max_length=80, blank=True)
    frame_price = models.DecimalField(max_digits=10, decimal_places=2)
    lens_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(5)])

    def __str__(self):
        return f"{self.quantity} × {self.product_name} ({self.color_name})"

    @property
    def line_total(self):
        return (self.frame_price + self.lens_price) * self.quantity
