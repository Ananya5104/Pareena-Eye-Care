import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


def _hash(email, code):
    return hmac.new(settings.SECRET_KEY.encode(), f"{email}:{code}".encode(), hashlib.sha256).hexdigest()


class LoginCode(models.Model):
    """A one-time 6-digit sign-in code sent by email. Only the hash is stored."""

    LIFETIME = timedelta(minutes=10)
    RESEND_AFTER = timedelta(seconds=30)
    MAX_ATTEMPTS = 3

    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=64)
    attempts = models.PositiveSmallIntegerField(default=0)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Code for {self.email} at {self.created_at:%Y-%m-%d %H:%M}"

    @classmethod
    def issue(cls, email):
        """Create a new code (invalidating older ones). Returns (instance, plain_code)."""
        code = f"{secrets.randbelow(10**6):06d}"
        cls.objects.filter(email=email, used=False).update(used=True)
        return cls.objects.create(email=email, code_hash=_hash(email, code)), code

    @classmethod
    def latest(cls, email):
        return cls.objects.filter(email=email).first()

    @property
    def expired(self):
        return timezone.now() > self.created_at + self.LIFETIME

    @property
    def resend_wait_seconds(self):
        remaining = (self.created_at + self.RESEND_AFTER - timezone.now()).total_seconds()
        return max(0, int(remaining + 0.999))

    def verify(self, code):
        """Return True if ``code`` matches. Counts attempts and burns the code on success."""
        if self.used or self.expired or self.attempts >= self.MAX_ATTEMPTS:
            return False
        if hmac.compare_digest(self.code_hash, _hash(self.email, code)):
            self.used = True
            self.save(update_fields=["used"])
            return True
        self.attempts += 1
        self.save(update_fields=["attempts"])
        return False


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Profile of {self.user}"
