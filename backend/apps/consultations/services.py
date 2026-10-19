from django.utils import timezone

from apps.core.notifications import admin_url, notify_doctor, notify_patient, send_email_safely
from apps.core.utils import whatsapp_link

from . import meet
from .models import ConsultationRequest


def _when(c):
    if c.scheduled_for:
        return timezone.localtime(c.scheduled_for).strftime("%a, %d %b at %I:%M %p")
    return "shortly"


def patient_message(c):
    return (
        f"Hello {c.name}, your quick eye consultation with Pareena Eye Care Center is approved.\n"
        f"Join the video call {_when(c)}: {c.meet_link}\n"
        "Please join from a well-lit place and keep your glasses/lenses nearby."
    )


def patient_whatsapp_link(c):
    if not c.meet_link:
        return ""
    return whatsapp_link(c.phone, patient_message(c))


def approve(c, generate_link=True):
    """Approve a request: create a Meet link if needed and email it to the patient.

    Returns a list of human-readable notes for the admin. Raises meet.MeetLinkError if no link
    can be obtained.
    """
    notes = []
    if not c.meet_link:
        if not generate_link:
            raise meet.MeetLinkError("No Meet link set.")
        c.meet_link, c.google_event_id = meet.create_meet_link(c)
        notes.append("Google Meet link generated.")

    now = timezone.now()
    c.status = ConsultationRequest.Status.APPROVED
    c.approved_at = c.approved_at or now

    emailed = False
    if c.email:
        emailed = send_email_safely(
            "Your video consultation link — Pareena Eye Care Center", patient_message(c), [c.email]
        )
    if emailed:
        notes.append(f"Link emailed to {c.email}.")
    else:
        notes.append("Use the WhatsApp button to send the link to the patient.")
    # WhatsApp sending is one click by the doctor, so record both channels as available.
    c.link_sent_via = ConsultationRequest.Channel.BOTH if emailed else ConsultationRequest.Channel.WHATSAPP
    c.link_sent_at = now
    c.save()
    return notes


def reject(c):
    c.status = ConsultationRequest.Status.REJECTED
    c.rejected_at = timezone.now()
    c.save(update_fields=["status", "rejected_at", "updated_at"])
    reason = c.rejection_reason or "We recommend an in-person eye examination for this issue."
    notify_patient(
        "About your consultation request — Pareena Eye Care Center",
        f"Hello {c.name},\n\n{reason}\n\nYou can book an eye test on our website or call the store.\n\n"
        "Pareena Eye Care Center",
        c.email,
    )


def complete(c):
    c.status = ConsultationRequest.Status.COMPLETED
    c.completed_at = timezone.now()
    c.save(update_fields=["status", "completed_at", "updated_at"])


def notify_new_request(c):
    notify_doctor(
        f"New consultation request: {c.issues_display} — {c.name}",
        (
            f"Name: {c.name}\nPhone: {c.phone}\nEmail: {c.email or '-'}\n"
            f"Issues: {c.issues_display}\nSince: {c.get_since_display()} · Eye: {c.get_eye_display()}\n"
            f"Best time for a call: {c.get_preferred_time_display()}\nPhotos: {c.photos.count()}\n\n"
            f"{c.issue_description}\n\n"
            f"Review & approve: {admin_url(f'/admin/consultations/consultationrequest/{c.pk}/change/')}\n"
            f"WhatsApp patient: {whatsapp_link(c.phone, f'Hello {c.name}, this is Pareena Eye Care Center about your consultation request.')}"
        ),
    )
    notify_patient(
        "We received your consultation request — Pareena Eye Care Center",
        f"Hello {c.name},\n\nThe optometrist will review your request and send you a video call link soon.\n\n"
        "If your eyes are painful, your vision drops suddenly, or you've had an injury, please visit "
        "the store or an emergency service immediately.\n\nPareena Eye Care Center",
        c.email,
    )
