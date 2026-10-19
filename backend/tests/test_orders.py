import hashlib
import tempfile
import hmac
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.catalog.models import LensType, Product, ProductVariant
from apps.orders.models import Order, OrderItem

RAZORPAY_KEYS = {"RAZORPAY_KEY_ID": "rzp_test_x", "RAZORPAY_KEY_SECRET": "secret"}


def fake_rp_order(order_id="order_ABC"):
    return mock.patch(
        "apps.orders.razorpay.create_order", return_value={"id": order_id, "amount": 100, "currency": "INR"}
    )


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="pareena-test-media-"))
class OrderTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed", "--demo", verbosity=0)

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.frame = Product.objects.get(model_number="8821")  # Carrera eyeglasses, SPH -10 to +6
        self.variant = self.frame.variants.first()
        self.single = LensType.objects.get(slug="single")
        self.blue = LensType.objects.get(slug="blue")
        self.prog = LensType.objects.get(slug="prog")
        self.sun = Product.objects.get(model_number="RB3025")

    def prescription(self, **data):
        payload = {"patient_name": "Meera", "right_sph": "-2.50", "left_sph": "-2.25", "right_cyl": "-0.75",
                   "right_axis": 90, **data}
        resp = self.client.post("/api/v1/prescriptions/", payload, format="json")
        self.assertEqual(resp.status_code, 201, resp.content)
        return resp.json()["reference"]

    def item(self, variant=None, lens=None, rx=None, qty=1):
        return {"variant_id": (variant or self.variant).id, "lens_type_id": lens.id if lens else None,
                "prescription_reference": rx, "quantity": qty}

    def order(self, *items, method="store"):
        return self.client.post(
            "/api/v1/orders/",
            {"customer_name": "Meera Shah", "phone": "9876543210", "payment_method": method,
             "items": list(items) or [self.item(lens=self.single, rx=self.prescription())]},
            format="json",
        )

    def test_prescription_validation(self):
        resp = self.client.post(
            "/api/v1/prescriptions/",
            {"patient_name": "M", "right_sph": "-2.30", "left_sph": "0", "right_cyl": "-1.00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("right_sph", resp.json())
        self.assertIn("right_axis", resp.json())
        resp = self.client.post("/api/v1/prescriptions/", {"patient_name": "M", "right_sph": "-25", "left_sph": "0"},
                                format="json")
        self.assertEqual(resp.status_code, 400)

    def test_prescription_accepts_pdf_upload(self):
        pdf = SimpleUploadedFile("rx.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        resp = self.client.post(
            "/api/v1/prescriptions/",
            {"patient_name": "M", "right_sph": "-1.00", "left_sph": "-1.00", "upload": pdf},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(resp.json()["has_upload"])
        bad = SimpleUploadedFile("rx.pdf", b"hello", content_type="application/pdf")
        resp = self.client.post(
            "/api/v1/prescriptions/",
            {"patient_name": "M", "right_sph": "-1.00", "left_sph": "-1.00", "upload": bad},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)

    def test_store_order_prices_server_side_and_reserves_stock(self):
        stock = self.variant.stock
        resp = self.order(self.item(lens=self.single, rx=self.prescription(), qty=2))
        self.assertEqual(resp.status_code, 201, resp.content)
        data = resp.json()
        self.assertIsNone(data["payment"])
        self.assertEqual(Decimal(data["order"]["total"]), (self.frame.price + self.single.price) * 2)
        self.assertEqual(data["order"]["items"][0]["prescription_name"], "Meera")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, stock - 2)

        order = Order.objects.get()
        order.cancel()
        order.cancel()  # idempotent
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, stock)

    def test_each_item_keeps_its_own_prescription(self):
        rx_a, rx_b = self.prescription(patient_name="Meera"), self.prescription(patient_name="Arjun")
        resp = self.order(self.item(lens=self.single, rx=rx_a), self.item(lens=self.single, rx=rx_b))
        self.assertEqual(resp.status_code, 201, resp.content)
        names = [i.prescription.patient_name for i in OrderItem.objects.order_by("id")]
        self.assertEqual(names, ["Meera", "Arjun"])

    def test_frame_only_and_sunglasses(self):
        resp = self.order(self.item(), self.item(variant=self.sun.variants.first()))
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(Decimal(resp.json()["order"]["total"]), self.frame.price + self.sun.price)
        # Sunglasses don't take a lens type.
        resp = self.order(self.item(variant=self.sun.variants.first(), lens=self.blue))
        self.assertEqual(resp.status_code, 400)

    def test_plain_lenses_need_a_lens_that_works_without_power(self):
        self.assertEqual(self.order(self.item(lens=self.blue)).status_code, 201)
        self.assertEqual(self.order(self.item(lens=self.single)).status_code, 400)

    def test_cannot_oversell(self):
        ProductVariant.objects.filter(pk=self.variant.pk).update(stock=1)
        self.assertEqual(self.order(self.item(qty=2)).status_code, 400)

    def test_progressive_needs_add_and_a_compatible_frame(self):
        self.assertEqual(self.order(self.item(lens=self.prog, rx=self.prescription())).status_code, 400)
        rx_add = self.prescription(right_add="1.50", left_add="1.50")
        self.assertEqual(self.order(self.item(lens=self.prog, rx=rx_add)).status_code, 201)
        kids = Product.objects.get(model_number="DJ-K201")  # not progressive-compatible
        self.assertEqual(self.order(self.item(variant=kids.variants.first(), lens=self.prog, rx=rx_add)).status_code,
                         400)

    def test_frame_power_range(self):
        rimless = Product.objects.get(model_number="DJ-5102")  # SPH -4 to +4
        rx = self.prescription(right_sph="-5.00")
        resp = self.order(self.item(variant=rimless.variants.first(), lens=self.single, rx=rx))
        self.assertEqual(resp.status_code, 400)
        self.assertIn("SPH", str(resp.json()))

    def test_online_payment_unavailable_without_keys(self):
        self.assertEqual(self.order(method="online").status_code, 400)

    @override_settings(**RAZORPAY_KEYS)
    def test_online_payment_flow(self):
        with fake_rp_order():
            resp = self.order(method="online")
        self.assertEqual(resp.status_code, 201, resp.content)
        ref = resp.json()["order"]["reference"]
        self.assertEqual(resp.json()["payment"]["razorpay_order_id"], "order_ABC")

        url = f"/api/v1/orders/{ref}/verify-payment/"
        bad = {"razorpay_order_id": "order_ABC", "razorpay_payment_id": "pay_1", "razorpay_signature": "nope"}
        self.assertEqual(self.client.post(url, bad, format="json").status_code, 400)

        sig = hmac.new(b"secret", b"order_ABC|pay_1", hashlib.sha256).hexdigest()
        resp = self.client.post(url, {**bad, "razorpay_signature": sig}, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        order = resp.json()["order"]
        self.assertEqual((order["payment_status"], order["status"]), ("paid", "confirmed"))

    @override_settings(**RAZORPAY_KEYS)
    def test_failed_payment_retry_and_switch_to_store(self):
        with fake_rp_order("order_1"):
            ref = self.order(method="online").json()["order"]["reference"]
        resp = self.client.post(f"/api/v1/orders/{ref}/payment-failed/")
        self.assertEqual(resp.json()["order"]["payment_status"], "failed")

        with fake_rp_order("order_2"):
            resp = self.client.post(f"/api/v1/orders/{ref}/pay/")
        self.assertEqual(resp.json()["payment"]["razorpay_order_id"], "order_2")
        self.assertEqual(resp.json()["order"]["payment_status"], "pending")

        resp = self.client.post(f"/api/v1/orders/{ref}/pay-at-store/")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["order"]["payment_method"], "store")
        # A store order can't be switched again, and can't be paid twice once paid.
        self.assertEqual(self.client.post(f"/api/v1/orders/{ref}/pay-at-store/").status_code, 400)
        Order.objects.filter(reference=ref).update(payment_status="paid")
        self.assertEqual(self.client.post(f"/api/v1/orders/{ref}/pay/").status_code, 400)

    @override_settings(**RAZORPAY_KEYS)
    def test_gateway_down_keeps_order_as_failed(self):
        from apps.orders.razorpay import RazorpayError

        with mock.patch("apps.orders.razorpay.create_order", side_effect=RazorpayError("down")):
            resp = self.order(method="online")
        self.assertEqual(resp.status_code, 201)
        self.assertIsNone(resp.json()["payment"])
        self.assertEqual(resp.json()["order"]["payment_status"], "failed")

    @override_settings(**RAZORPAY_KEYS)
    def test_release_unpaid_orders(self):
        stock = self.variant.stock
        with fake_rp_order():
            self.order(self.item(lens=self.blue), method="online")
        call_command("release_unpaid_orders", "--minutes", "-1", verbosity=0)
        self.assertEqual(Order.objects.get().status, "cancelled")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, stock)

    def test_catalogue_endpoints(self):
        products = self.client.get("/api/v1/products/", {"category": "sunglasses", "page_size": 100}).json()
        self.assertTrue(products["results"])
        self.assertTrue(all(p["category"] == "sunglasses" for p in products["results"]))
        detail = self.client.get(f"/api/v1/products/{self.frame.slug}/").json()
        self.assertEqual(detail["size_label"], "54-17-145")
        self.assertEqual(detail["power_range"], "SPH −10.00 to +6.00")
        self.assertIn(self.prog.id, detail["lens_types"])
        kids = Product.objects.get(model_number="DJ-K201")
        kids_detail = self.client.get(f"/api/v1/products/{kids.slug}/").json()
        self.assertNotIn(self.prog.id, kids_detail["lens_types"])
        self.assertEqual(self.client.get(f"/api/v1/products/{self.sun.slug}/").json()["power_range"], "No power")
        guide = self.client.get("/api/v1/lens-types/", {"guide": "true"}).json()
        self.assertEqual([lens["slug"] for lens in guide], ["single", "blue", "glare", "photo", "prog"])
        brands = {b["name"] for b in self.client.get("/api/v1/brands/").json()}
        self.assertTrue({"Ray-Ban", "Oakley", "Maui Jim", "Tommy Hilfiger", "David Jones"} <= brands)
