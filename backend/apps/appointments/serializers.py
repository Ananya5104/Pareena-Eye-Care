from rest_framework import serializers

from apps.core.models import ClinicSettings
from apps.core.utils import CleanCharField, PhoneField

from .models import Appointment
from .slots import validate_slot


class AppointmentSerializer(serializers.ModelSerializer):
    name = CleanCharField(max_length=120, min_length=2)
    phone = PhoneField()
    for_whom = CleanCharField(max_length=40, required=False)
    reason = CleanCharField(max_length=120, min_length=3)
    notes = CleanCharField(max_length=1000, required=False, allow_blank=True)
    time = serializers.TimeField(format="%H:%M", input_formats=["%H:%M", "%H:%M:%S"])

    class Meta:
        model = Appointment
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "for_whom",
            "reason",
            "notes",
            "date",
            "time",
            "duration_minutes",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "duration_minutes", "status", "created_at"]
        # Slot clashes are handled in validate() and by the DB constraint, with a patient-friendly message.
        validators = []

    def validate(self, attrs):
        error = validate_slot(attrs["date"], attrs["time"])
        if error:
            raise serializers.ValidationError({"time": [error]})
        return attrs

    def create(self, validated_data):
        validated_data["duration_minutes"] = ClinicSettings.load().slot_duration_minutes
        return super().create(validated_data)


class SlotSerializer(serializers.Serializer):
    time = serializers.TimeField(format="%H:%M")
    available = serializers.BooleanField()


class DaySlotsSerializer(serializers.Serializer):
    date = serializers.DateField()
    slot_duration_minutes = serializers.IntegerField()
    slots = SlotSerializer(many=True)
