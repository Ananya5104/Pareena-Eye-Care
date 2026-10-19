import hashlib
import hmac
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.catalog.models import LensType, Product, ProductVariant
from apps.orders.models import Order, Prescription


class OrderTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", "--demo", verbosity=0)

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.frame = Product.objects.get(model_number="8821")  # Carrera eyeglasses, max power 8.00
        self.variant = self.frame.variants.first()
        self.single = LensType.objects.get(name="Single Vision")
        self.progressive = LensType.objects.get(name="Progressive")

    def prescription(self, **data):
        payload = {"right_sph": "-2.50", "left_sph": "-2.25", "right_cyl": "-0.75", "right_axis": 90, **data}
        resp = self.client.post("/api/v1/prescriptions/", payload, format="json")
        self.assertEqual(resp.status_code, 201, resp.content)
        return resp.json()["reference"]

    def order(self, rx=None, lens=None, qty=1, method="store", variant=None):
        return self.client.post(
            "/api/v1/orders/",
            {
                "customer_name": "Meera Shah",
                "phone": "9876543210",
                "payment_method": method,
                "prescription_reference": rx,
                "items": [
                    {
                        "variant_id": (variant or self.variant).id,
                        "lens_type_id": (lens or self.single).id,
                        "quantity": qty,
                    }
                ],
            },
            format="json",
        )

    def test_prescription_validation(self):
        resp = self.client.post("/api/v1/prescriptions/", {"right_sph": "-2.30", "right_cyl": "-1.00"}, format="json")
        self.assertEqual(resp.status_code, 400)
        body = resp.json()
        self.assertIn("right_sph", body)  # not a 0.25 step
        self.assertIn("right_axis", body)  # cyl given without axis
        resp = self.client.post("/api/v1/prescriptions/", {"right_sph": "-25"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_store_order_prices_server_side_and_reserves_stock(self):
        rx = self.prescription()
        stock = self.variant.stock
        resp = self.order(rx=rx, qty=2)
        self.assertEqual(resp.status_code, 201, resp.content)
        data = resp.json()
        self.assertIsNone(data["payment"])
        expected = (self.frame.price + self.single.price) * 2
        self.assertEqual(Decimal(data["order"]["total"]), expected)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, stock - 2)

        order = Order.objects.get()
        order.cancel()
        order.cancel()  # idempotent
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, stock)

    def test_cannot_oversell(self):
        rx = self.prescription()
        ProductVariant.objects.filter(pk=self.variant.pk).update(stock=1)
        self.assertEqual(self.order(rx=rx, qty=2).status_code, 400)

    def test_prescription_lens_requires_prescription(self):
        self.assertEqual(self.order(rx=None).status_code, 400)

    def test_progressive_requires_add(self):
        rx = self.prescription()
        self.assertEqual(self.order(rx=rx, lens=self.progressive).status_code, 400)
        rx = self.prescription(add_power="1.50")
        self.assertEqual(self.order(rx=rx, lens=self.progressive).status_code, 201)

    def test_frame_power_limit(self):
        rimless = Product.objects.get(model_number="DJ-5102")  # max 4.00
        rx = self.prescription(right_sph="-5.00")
        self.assertEqual(self.order(rx=rx, variant=rimless.variants.first()).status_code, 400)

    def test_sunglass_lens_not_offered_for_eyeglasses(self):
        rx = self.prescription()
        sun = LensType.objects.get(name="Standard Sunglass Lenses")
        self.assertEqual(self.order(rx=rx, lens=sun).status_code, 400)

    def test_zero_power_prescription(self):
        resp = self.client.post("/api/v1/prescriptions/", {"no_power": True, "right_sph": "-3"}, format="json")
        self.assertEqual(resp.status_code, 201)
        rx = Prescription.objects.get(reference=resp.json()["reference"])
        self.assertEqual(rx.right_sph, 0)
        blue = LensType.objects.get(name="Blue Light Protection")
        self.assertEqual(self.order(rx=str(rx.reference), lens=blue).status_code, 201)

    def test_online_payment_unavailable_without_keys(self):
        rx = self.prescription()
        self.assertEqual(self.order(rx=rx, method="online").status_code, 400)

    @override_settings(RAZORPAY_KEY_ID="rzp_test_x", RAZORPAY_KEY_SECRET="secret")
    def test_online_payment_flow(self):
        rx = self.prescription()
        with mock.patch(
            "apps.orders.razorpay.create_order",
            return_value={"id": "order_ABC", "amount": 100, "currency": "INR"},
        ):
            resp = self.order(rx=rx, method="online")
        self.assertEqual(resp.status_code, 201, resp.content)
        ref = resp.json()["order"]["reference"]
        self.assertEqual(resp.json()["payment"]["razorpay_order_id"], "order_ABC")

        url = f"/api/v1/orders/{ref}/verify-payment/"
        bad = {"razorpay_order_id": "order_ABC", "razorpay_payment_id": "pay_1", "razorpay_signature": "nope"}
        self.assertEqual(self.client.post(url, bad, format="json").status_code, 400)

        sig = hmac.new(b"secret", b"order_ABC|pay_1", hashlib.sha256).hexdigest()
        resp = self.client.post(url, {**bad, "razorpay_signature": sig}, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["payment_status"], "paid")
        self.assertEqual(resp.json()["status"], "confirmed")

    def test_release_unpaid_orders(self):
        rx = self.prescription()
        stock = self.variant.stock
        with override_settings(RAZORPAY_KEY_ID="k", RAZORPAY_KEY_SECRET="s"), mock.patch(
            "apps.orders.razorpay.create_order", return_value={"id": "order_X", "amount": 1, "currency": "INR"}
        ):
            self.order(rx=rx, method="online")
        call_command("release_unpaid_orders", "--minutes", "-1", verbosity=0)
        self.assertEqual(Order.objects.get().status, "cancelled")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, stock)

    def test_products_and_lens_guide_endpoints(self):
        products = self.client.get("/api/v1/products/", {"category": "sunglasses"}).json()
        self.assertTrue(all(p["category"] == "sunglasses" for p in products["results"]))
        detail = self.client.get(f"/api/v1/products/{self.frame.slug}/").json()
        lens_names = {lens["name"] for lens in detail["lens_types"]}
        self.assertIn("Progressive", lens_names)
        self.assertNotIn("Standard Sunglass Lenses", lens_names)
        guide = self.client.get("/api/v1/lens-types/", {"guide": "true"}).json()
        self.assertEqual(
            [lens["name"] for lens in guide],
            ["Single Vision", "Anti-Glare", "Blue Light Protection", "Photochromic", "Progressive"],
        )
        brands = {b["name"] for b in self.client.get("/api/v1/brands/").json()}
        self.assertTrue({"Ray-Ban", "Oakley", "Maui Jim", "Tommy Hilfiger", "David Jones"} <= brands)
