from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.utils import CleanCharField, PhoneField

from .models import Profile

User = get_user_model()


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class UserSerializer(serializers.ModelSerializer):
    """The signed-in customer. `name` is stored across Django's first/last name fields."""

    name = CleanCharField(max_length=150, required=False, allow_blank=True)
    phone = PhoneField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "email", "name", "phone"]
        read_only_fields = ["id", "email"]

    def to_representation(self, user):
        profile = getattr(user, "profile", None)
        return {
            "id": user.id,
            "email": user.email,
            "name": user.get_full_name(),
            "phone": profile.phone if profile else "",
        }

    def validate_phone(self, value):
        return value or ""

    def update(self, user, validated_data):
        if "name" in validated_data:
            first, _, last = validated_data["name"].partition(" ")
            user.first_name, user.last_name = first[:150], last[:150]
            user.save(update_fields=["first_name", "last_name"])
        if "phone" in validated_data:
            Profile.objects.update_or_create(user=user, defaults={"phone": validated_data["phone"]})
        return user


class RequestCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})

    def validate_email(self, value):
        return value.strip().lower()
