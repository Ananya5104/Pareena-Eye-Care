"""Google Meet link generation through the Google Calendar API.

Creating a calendar event with ``conferenceData.createRequest`` makes Google attach a
Meet link. Credentials are an OAuth client + refresh token for the doctor's Google
account (see docs/GOOGLE_MEET_SETUP.md). Without them, the doctor pastes a link manually.
"""
import datetime
import logging
import uuid

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"


class MeetLinkError(Exception):
    pass


def is_configured():
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and settings.GOOGLE_REFRESH_TOKEN)


def _session():
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2.credentials import Credentials

    creds = Credentials(
        token=None,
        refresh_token=settings.GOOGLE_REFRESH_TOKEN,
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=[CALENDAR_SCOPE],
    )
    return AuthorizedSession(creds)


def create_meet_link(consultation, duration_minutes=15):
    """Create a calendar event with a Meet link. Returns ``(meet_url, event_id)``."""
    if not is_configured():
        raise MeetLinkError(
            "Google Calendar isn't configured. Paste a Meet link manually or set GOOGLE_* env variables."
        )

    start = consultation.scheduled_for or (timezone.now() + datetime.timedelta(minutes=30))
    end = start + datetime.timedelta(minutes=duration_minutes)
    body = {
        "summary": f"Eye consultation — {consultation.name}",
        "description": (
            f"Issues: {consultation.issues_display}\n"
            f"Phone: {consultation.phone}\n\n{consultation.issue_description}"
        ),
        "start": {"dateTime": start.isoformat(), "timeZone": settings.TIME_ZONE},
        "end": {"dateTime": end.isoformat(), "timeZone": settings.TIME_ZONE},
        "conferenceData": {
            "createRequest": {
                "requestId": uuid.uuid4().hex,
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }
    if consultation.email:
        body["attendees"] = [{"email": consultation.email}]

    url = f"https://www.googleapis.com/calendar/v3/calendars/{settings.GOOGLE_CALENDAR_ID}/events"
    try:
        resp = _session().post(url, params={"conferenceDataVersion": 1, "sendUpdates": "none"}, json=body, timeout=20)
    except Exception as exc:
        logger.exception("Google Calendar request failed")
        raise MeetLinkError(f"Could not reach Google Calendar: {exc}") from exc

    if resp.status_code >= 400:
        logger.error("Google Calendar error %s: %s", resp.status_code, resp.text)
        raise MeetLinkError(f"Google Calendar returned {resp.status_code}. Check credentials and calendar ID.")

    data = resp.json()
    link = data.get("hangoutLink")
    if not link:
        for entry in data.get("conferenceData", {}).get("entryPoints", []):
            if entry.get("entryPointType") == "video":
                link = entry.get("uri")
                break
    if not link:
        raise MeetLinkError("Event created but Google did not return a Meet link.")
    return link, data.get("id", "")
