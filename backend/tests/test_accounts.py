from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient


class AccountTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_register_login_me(self):
        resp = self.client.post(
            "/api/v1/auth/register/",
            {"email": "Pat@Example.com", "password": "clear-vision-42", "first_name": "Pat"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        resp = self.client.post(
            "/api/v1/auth/login/", {"email": "pat@example.com", "password": "clear-vision-42"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.json()['access']}")
        self.assertEqual(self.client.get("/api/v1/auth/me/").json()["email"], "pat@example.com")
        self.assertEqual(self.client.get("/api/v1/appointments/").status_code, 200)

    def test_bad_login(self):
        resp = self.client.post("/api/v1/auth/login/", {"email": "x@y.com", "password": "nope"}, format="json")
        self.assertEqual(resp.status_code, 400)
