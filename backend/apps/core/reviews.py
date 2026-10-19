"""Google reviews via the Places API (New), cached so we stay well inside the free quota.

Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID. Without them, `get_reviews()` returns None and
the website shows links to Google instead.
"""
import logging

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_KEY = "google-reviews-v1"
CACHE_SECONDS = 6 * 60 * 60
FAILURE_CACHE_SECONDS = 10 * 60


def get_reviews():
    if not (settings.GOOGLE_PLACES_API_KEY and settings.GOOGLE_PLACE_ID):
        return None
    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached or None  # {} marks a recent failure

    try:
        resp = requests.get(
            f"https://places.googleapis.com/v1/places/{settings.GOOGLE_PLACE_ID}",
            headers={
                "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
            },
            params={"languageCode": "en"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        logger.exception("Could not fetch Google reviews")
        cache.set(CACHE_KEY, {}, FAILURE_CACHE_SECONDS)
        return None

    result = {
        "rating": data.get("rating") or 0,
        "total": data.get("userRatingCount") or 0,
        "url": data.get("googleMapsUri", ""),
        "reviews": [
            {
                "author": (r.get("authorAttribution") or {}).get("displayName", "Google user"),
                "author_url": (r.get("authorAttribution") or {}).get("uri", ""),
                "rating": r.get("rating", 0),
                "when": r.get("relativePublishTimeDescription", ""),
                "text": (r.get("text") or r.get("originalText") or {}).get("text", ""),
                "url": r.get("googleMapsUri", ""),
            }
            for r in data.get("reviews", [])
            if (r.get("text") or r.get("originalText"))
        ],
    }
    cache.set(CACHE_KEY, result, CACHE_SECONDS)
    return result
