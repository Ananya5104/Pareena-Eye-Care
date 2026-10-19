from decimal import Decimal

from django.db import transaction
from django.db.models import F
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.catalog.models import LensType, Product, ProductVariant
from apps.catalog.serializers import absolute_url
from apps.core.models import ClinicSettings
from apps.core.utils import CleanCharField, PhoneField, validate_uploaded_document

from . import razorpay
from .models import Order, OrderItem, Prescription

QUARTER = Decimal("0.25")


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = CleanCharField(max_length=120, min_length=1)
    prescription_date = CleanCharField(max_length=40, required=False, allow_blank=True)
    upload = serializers.FileField(required=False, allow_null=True, write_only=True)
    has_upload = serializers.SerializerMethodField()
    summary = serializers.CharField(read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "reference",
            "patient_name",
            "prescription_date",
            "right_sph",
            "right_cyl",
            "right_axis",
            "right_add",
            "left_sph",
            "left_cyl",
            "left_axis",
            "left_add",
            "pupillary_distance",
            "upload",
            "has_upload",
            "summary",
            "created_at",
        ]
        read_only_fields = ["reference", "created_at"]

    def get_has_upload(self, obj) -> bool:
        return bool(obj.upload)

    def validate_upload(self, value):
        if value:
            validate_uploaded_document(value)
        return value

    def validate(self, attrs):
        errors = {}
        for eye in ("right", "left"):
            for part in ("sph", "cyl", "add"):
                value = attrs.get(f"{eye}_{part}")
                if value is not None and value % QUARTER != 0:
                    errors[f"{eye}_{part}"] = [f"{part.upper()} must be in steps of 0.25."]
            cyl, axis = attrs.get(f"{eye}_cyl") or 0, attrs.get(f"{eye}_axis")
            if cyl and axis is None:
                errors[f"{eye}_axis"] = ["Axis is required when CYL is entered. It's a number from 0 to 180."]
            if not cyl:
                attrs[f"{eye}_axis"] = None
            if attrs.get(f"{eye}_add") == 0:
                attrs[f"{eye}_add"] = None
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class OrderItemInputSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    lens_type_id = serializers.IntegerField(required=False, allow_null=True)
    prescription_reference = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, max_value=5, default=1)


class OrderItemSerializer(serializers.ModelSerializer):
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    brand = serializers.CharField(source="product.brand.name", read_only=True)
    category = serializers.CharField(source="product.category", read_only=True)
    image = serializers.SerializerMethodField()
    prescription_name = serializers.CharField(source="prescription.patient_name", default=None, read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "product_name",
            "product_slug",
            "brand",
            "category",
            "image",
            "color_name",
            "lens_name",
            "prescription_name",
            "frame_price",
            "lens_price",
            "quantity",
            "line_total",
        ]

    @extend_schema_field(OpenApiTypes.URI)
    def get_image(self, obj):
        images = list(obj.product.images.all())
        return absolute_url(self.context.get("request"), images[0].image) if images else None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "reference",
            "order_number",
            "customer_name",
            "phone",
            "email",
            "notes",
            "status",
            "status_display",
            "payment_method",
            "payment_status",
            "total",
            "items",
            "created_at",
        ]


class OrderCreateSerializer(serializers.Serializer):
    customer_name = CleanCharField(max_length=120, min_length=2)
    phone = PhoneField()
    email = serializers.EmailField(required=False, allow_blank=True)
    notes = CleanCharField(max_length=500, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Your cart is empty.")
        if len(items) > 10:
            raise serializers.ValidationError("Too many items in one order.")
        return items

    def validate(self, attrs):
        if attrs["payment_method"] == Order.PaymentMethod.ONLINE and not online_payments_available():
            raise serializers.ValidationError(
                {"payment_method": ["Online payment is unavailable right now. Choose pay at store."]}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context["request"]
        user = request.user if request.user.is_authenticated else None

        refs = {i["prescription_reference"] for i in items_data if i.get("prescription_reference")}
        prescriptions = {p.reference: p for p in Prescription.objects.filter(reference__in=refs)}

        lines, errors, total = [], {}, Decimal("0")
        for idx, item in enumerate(items_data):
            try:
                # Lock the row so concurrent orders can't oversell the same variant.
                variant = (
                    ProductVariant.objects.select_for_update()
                    .select_related("product", "product__brand")
                    .get(pk=item["variant_id"], is_active=True, product__is_active=True)
                )
            except ProductVariant.DoesNotExist:
                errors[idx] = "This product is no longer available."
                continue
            product, qty = variant.product, item["quantity"]
            if variant.stock < qty:
                errors[idx] = f"Only {variant.stock} left of {product} in {variant.color_name}."
                continue

            rx = None
            if item.get("prescription_reference"):
                rx = prescriptions.get(item["prescription_reference"])
                if rx is None:
                    errors[idx] = "Prescription not found. Please enter it again."
                    continue

            lens = None
            if item.get("lens_type_id"):
                if product.category != Product.Category.EYEGLASSES:
                    errors[idx] = "Sunglasses come with their own lenses."
                    continue
                lens = product.available_lens_types().filter(pk=item["lens_type_id"]).first()
                if lens is None:
                    errors[idx] = "That lens type isn't available for this frame."
                    continue
                error = lens_error(lens, product, rx)
                if error:
                    errors[idx] = error
                    continue

            lines.append((product, variant, lens, rx if lens else None, qty))
            total += (product.price + (lens.price if lens else Decimal("0"))) * qty

        if errors:
            raise serializers.ValidationError({"items": errors})

        order = Order.objects.create(user=user, total=total, **validated_data)
        for product, variant, lens, rx, qty in lines:
            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                lens_type=lens,
                prescription=rx,
                product_name=str(product),
                color_name=variant.color_name,
                lens_name=lens.name if lens else "",
                frame_price=product.price,
                lens_price=lens.price if lens else Decimal("0"),
                quantity=qty,
            )
            ProductVariant.objects.filter(pk=variant.pk).update(stock=F("stock") - qty)
            if rx and user and rx.user_id is None:
                Prescription.objects.filter(pk=rx.pk).update(user=user)
        return order


def online_payments_available():
    return razorpay.is_configured() and ClinicSettings.load().online_payments_enabled


def lens_error(lens: LensType, product: Product, rx):
    """Why this lens can't be made for this frame and prescription, or None."""
    if rx is None:
        if not lens.works_without_power:
            return f"{lens.name} lenses need your prescription."
        return None
    if lens.requires_addition and not rx.has_add:
        return f"{lens.name} lenses need an ADD value in your prescription."
    for sph in (rx.right_sph, rx.left_sph):
        error = product.power_error(sph)
        if error:
            return error
    return None


class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=60)
    razorpay_payment_id = serializers.CharField(max_length=60)
    razorpay_signature = serializers.CharField(max_length=200)
