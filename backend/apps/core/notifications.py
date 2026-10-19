"""Email helpers. Sending happens after the DB transaction commits and never breaks a request."""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction

logger = logging.getLogger(__name__)


def send_email_safely(subject, message, recipients):
    recipients = [r for r in recipients if r]
    if not recipients:
        return False
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipients, fail_silently=False)
        return True
    except Exception:
        logger.exception("Failed to send email %r to %s", subject, recipients)
        return False


def notify_doctor(subject, message):
    """Queue an email to the doctor(s) once the current transaction commits."""
    recipients = list(settings.DOCTOR_NOTIFICATION_EMAILS)
    transaction.on_commit(lambda: send_email_safely(subject, message, recipients))


def notify_patient(subject, message, email):
    if email:
        transaction.on_commit(lambda: send_email_safely(subject, message, [email]))


def admin_url(path):
    return f"{settings.BACKEND_URL}{path}"
