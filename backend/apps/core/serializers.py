from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import BusinessHours, ClinicSettings, Optometrist, StoreImage, Testimonial


class BusinessHoursSerializer(serializers.ModelSerializer):
    weekday_name = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = BusinessHours
        fields = ["weekday", "weekday_name", "open_time", "close_time", "is_closed"]


class OptometristSerializer(serializers.ModelSerializer):
    class Meta:
        model = Optometrist
        fields = ["id", "name", "photo", "qualifications", "experience_years", "specialization", "bio"]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["id", "patient_name", "quote", "rating"]


class StoreImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreImage
        fields = ["id", "image", "caption"]


class ClinicSettingsSerializer(serializers.ModelSerializer):
    business_hours = serializers.SerializerMethodField()
    online_payments_available = serializers.SerializerMethodField()

    class Meta:
        model = ClinicSettings
        fields = [
            "name",
            "tagline",
            "description",
            "philosophy",
            "address",
            "phone",
            "whatsapp_number",
            "email",
            "google_maps_embed_url",
            "google_maps_link",
            "slot_duration_minutes",
            "booking_window_days",
            "consultations_enabled",
            "online_payments_available",
            "business_hours",
        ]

    @extend_schema_field(BusinessHoursSerializer(many=True))
    def get_business_hours(self, obj):
        rows = {row.weekday: row for row in BusinessHours.objects.all()}
        result = []
        for weekday, label in BusinessHours.WEEKDAYS:
            row = rows.get(weekday)
            if row is None:
                open_t, close_t = BusinessHours.DEFAULTS[weekday]
                row = BusinessHours(weekday=weekday, open_time=open_t, close_time=close_t)
            result.append(BusinessHoursSerializer(row).data)
        return result

    def get_online_payments_available(self, obj) -> bool:
        return bool(obj.online_payments_enabled and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)
