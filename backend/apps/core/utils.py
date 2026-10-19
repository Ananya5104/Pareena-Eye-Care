"""Shared helpers: input sanitising, phone normalisation, WhatsApp links, image checks."""
import re
import uuid
from urllib.parse import quote

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.html import strip_tags
from PIL import Image
from rest_framework import serializers

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_PHONE_STRIP = re.compile(r"[\s\-().]")
_PHONE_VALID = re.compile(r"^\+?\d{10,15}$")


def sanitize_text(value):
    """Remove HTML tags and control characters, collapse surrounding whitespace."""
    if value is None:
        return value
    value = strip_tags(str(value))
    value = _CONTROL_CHARS.sub("", value)
    return value.strip()


class CleanCharField(serializers.CharField):
    """CharField that strips HTML/control characters from user input."""

    def to_internal_value(self, data):
        return super().to_internal_value(sanitize_text(data))


def normalize_phone(value):
    """Return an E.164-ish phone string (``+<country><number>``) or raise ValidationError."""
    raw = _PHONE_STRIP.sub("", str(value or ""))
    if not _PHONE_VALID.match(raw):
        raise ValidationError("Enter a valid phone number (10–15 digits).")
    digits = raw.lstrip("+")
    if not raw.startswith("+"):
        if len(digits) == 10:
            digits = f"{settings.DEFAULT_COUNTRY_CODE}{digits}"
        elif digits.startswith("0") and len(digits) == 11:
            digits = f"{settings.DEFAULT_COUNTRY_CODE}{digits[1:]}"
    return f"+{digits}"


class PhoneField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs.setdefault("max_length", 20)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        try:
            return normalize_phone(value)
        except ValidationError as exc:
            raise serializers.ValidationError(exc.messages)


def whatsapp_link(phone, message=""):
    """Build a click-to-chat wa.me link with a pre-filled message."""
    digits = re.sub(r"\D", "", phone or "")
    url = f"https://wa.me/{digits}"
    if message:
        url += f"?text={quote(message)}"
    return url


ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_uploaded_image(file):
    """Validate size and real image content (not just extension)."""
    if file.size > settings.MAX_UPLOAD_SIZE:
        mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
        raise serializers.ValidationError(f"Image must be smaller than {mb} MB.")
    try:
        image = Image.open(file)
        fmt = image.format
        image.verify()
    except Exception:
        raise serializers.ValidationError("Upload a valid JPEG, PNG or WEBP image.")
    finally:
        file.seek(0)
    if fmt not in ALLOWED_IMAGE_FORMATS:
        raise serializers.ValidationError("Upload a valid JPEG, PNG or WEBP image.")
    return file


def validate_uploaded_document(file):
    """Accept a real image or a PDF (e.g. a scanned prescription)."""
    head = file.read(5)
    file.seek(0)
    if head == b"%PDF-":
        if file.size > settings.MAX_UPLOAD_SIZE:
            mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
            raise serializers.ValidationError(f"File must be smaller than {mb} MB.")
        return file
    try:
        return validate_uploaded_image(file)
    except serializers.ValidationError as exc:
        if "smaller" in str(exc.detail[0]):
            raise
        raise serializers.ValidationError("Upload a photo (JPEG, PNG, WEBP) or a PDF.")


@deconstructible
class RandomUploadPath:
    """upload_to that stores files under an unguessable random name in ``folder``."""

    def __init__(self, folder):
        self.folder = folder

    def __call__(self, instance, filename):
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
        return f"{self.folder}/{uuid.uuid4().hex}.{ext[:5]}"

    def __eq__(self, other):
        return isinstance(other, RandomUploadPath) and other.folder == self.folder
