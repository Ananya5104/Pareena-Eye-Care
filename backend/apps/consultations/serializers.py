from django.db import transaction
from rest_framework import serializers

from apps.core.utils import CleanCharField, PhoneField, validate_uploaded_image

from .models import ConsultationPhoto, ConsultationRequest


class ConsultationRequestSerializer(serializers.ModelSerializer):
    """Multipart: send `issues` and `photos` as repeated form fields."""

    name = CleanCharField(max_length=120, min_length=2)
    phone = PhoneField()
    issue_description = CleanCharField(max_length=1000, min_length=20)
    issues = serializers.ListField(
        child=serializers.ChoiceField(choices=ConsultationRequest.Issue.choices), min_length=1, max_length=6
    )
    photos = serializers.ListField(
        child=serializers.ImageField(), required=False, write_only=True,
        max_length=ConsultationPhoto.MAX_PER_REQUEST,
    )

    class Meta:
        model = ConsultationRequest
        fields = [
            "reference",
            "name",
            "phone",
            "email",
            "issues",
            "since",
            "eye",
            "preferred_time",
            "issue_description",
            "photos",
            "status",
            "created_at",
        ]
        read_only_fields = ["reference", "status", "created_at"]

    def validate_issues(self, value):
        return list(dict.fromkeys(value))  # de-duplicate, keep order

    def validate_photos(self, value):
        for photo in value:
            validate_uploaded_image(photo)
        return value

    @transaction.atomic
    def create(self, validated_data):
        photos = validated_data.pop("photos", [])
        consultation = super().create(validated_data)
        for photo in photos:
            ConsultationPhoto.objects.create(consultation=consultation, image=photo)
        return consultation


class ConsultationStatusSerializer(serializers.ModelSerializer):
    """Public status lookup by reference. The Meet link only appears once approved."""

    meet_link = serializers.SerializerMethodField()
    patient_notes = serializers.SerializerMethodField()
    rejection_reason = serializers.SerializerMethodField()
    photo_count = serializers.IntegerField(source="photos.count", read_only=True)
    preferred_time_display = serializers.CharField(source="get_preferred_time_display", read_only=True)

    class Meta:
        model = ConsultationRequest
        fields = [
            "reference",
            "status",
            "issues",
            "preferred_time",
            "preferred_time_display",
            "photo_count",
            "scheduled_for",
            "meet_link",
            "patient_notes",
            "rejection_reason",
            "created_at",
        ]

    def get_meet_link(self, obj) -> str | None:
        return obj.meet_link if obj.status == ConsultationRequest.Status.APPROVED else None

    def get_patient_notes(self, obj) -> str | None:
        return obj.patient_notes if obj.status == ConsultationRequest.Status.COMPLETED else None

    def get_rejection_reason(self, obj) -> str | None:
        return obj.rejection_reason if obj.status == ConsultationRequest.Status.REJECTED else None
