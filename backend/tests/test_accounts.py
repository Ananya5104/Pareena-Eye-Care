import re
from datetime import timedelta

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import LoginCode

CODE_URL = "/api/v1/auth/code/"
VERIFY_URL = "/api/v1/auth/verify/"


class EmailCodeSignInTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def request_code(self, email="Pat@Example.com"):
        resp = self.client.post(CODE_URL, {"email": email}, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        return re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)

    def test_new_user_signs_in_then_sets_name(self):
        code = self.request_code()
        self.assertEqual(mail.outbox[-1].to, ["pat@example.com"])
        resp = self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        body = resp.json()
        self.assertTrue(body["is_new"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {body['access']}")
        resp = self.client.patch("/api/v1/auth/me/", {"name": "Pat Rao", "phone": "9876543210"}, format="json")
        self.assertEqual(resp.json(), {"id": body["user"]["id"], "email": "pat@example.com",
                                       "name": "Pat Rao", "phone": "+919876543210"})
        self.assertEqual(self.client.get("/api/v1/appointments/").status_code, 200)

    def test_returning_user_is_not_new(self):
        code = self.request_code()
        token = self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json").json()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token['access']}")
        self.client.patch("/api/v1/auth/me/", {"name": "Pat"}, format="json")
        self.client.credentials()
        LoginCode.objects.update(created_at=LoginCode.objects.first().created_at - timedelta(minutes=1))
        code = self.request_code()
        resp = self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json")
        self.assertFalse(resp.json()["is_new"])

    def test_wrong_code_counts_down_then_locks(self):
        code = self.request_code()
        wrong = "000000" if code != "000000" else "111111"
        messages = [
            self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": wrong}, format="json").json()
            for _ in range(3)
        ]
        self.assertEqual([m["tries_left"] for m in messages], [2, 1, 0])
        # Even the right code fails once locked.
        resp = self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_code_is_single_use_and_expires(self):
        code = self.request_code()
        self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json")
        resp = self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json")
        self.assertEqual(resp.status_code, 400)

        LoginCode.objects.update(created_at=LoginCode.objects.first().created_at - timedelta(minutes=11))
        code = self.request_code()
        LoginCode.objects.filter(used=False).update(created_at=LoginCode.objects.first().created_at - timedelta(minutes=11))
        resp = self.client.post(VERIFY_URL, {"email": "pat@example.com", "code": code}, format="json")
        self.assertIn("expired", resp.json()["detail"])

    def test_resend_cooldown(self):
        self.request_code()
        resp = self.client.post(CODE_URL, {"email": "pat@example.com"}, format="json")
        self.assertEqual(resp.status_code, 429)
        self.assertGreater(resp.json()["resend_in"], 0)
