"""Minimal Razorpay client: create orders and verify signatures.

Uses the REST API directly (https://razorpay.com/docs/api/orders/) to avoid an extra SDK.
"""
import hashlib
import hmac
from decimal import Decimal

import requests
from django.conf import settings

API_BASE = "https://api.razorpay.com/v1"


class RazorpayError(Exception):
    pass


def is_configured():
    return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def to_paise(amount: Decimal) -> int:
    return int((amount * 100).quantize(Decimal("1")))


def create_order(amount: Decimal, receipt: str, notes=None):
    if not is_configured():
        raise RazorpayError("Online payments are not configured.")
    try:
        resp = requests.post(
            f"{API_BASE}/orders",
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
            json={
                "amount": to_paise(amount),
                "currency": settings.CURRENCY,
                "receipt": receipt[:40],
                "notes": notes or {},
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        raise RazorpayError("Could not reach the payment gateway.") from exc
    if resp.status_code >= 400:
        raise RazorpayError(f"Payment gateway error ({resp.status_code}).")
    return resp.json()


def verify_payment_signature(razorpay_order_id, razorpay_payment_id, signature):
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_webhook_signature(body: bytes, signature, secret):
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")
