import json
import logging

from django.conf import settings
from django.db import transaction
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import mixins, parsers, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.notifications import admin_url, notify_doctor, notify_patient
from apps.core.utils import whatsapp_link

from . import razorpay
from .models import Order, Prescription
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    PrescriptionSerializer,
    VerifyPaymentSerializer,
    online_payments_available,
)

logger = logging.getLogger(__name__)


class PrescriptionViewSet(
    mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    """Save an eyesight prescription (JSON, or multipart with `upload`). Retrieve by reference UUID."""

    serializer_class = PrescriptionSerializer
    lookup_field = "reference"
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    throttle_scope = "prescriptions"

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.action == "create" else super().get_throttles()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Prescription.objects.none()
        if self.action == "list":
            return Prescription.objects.filter(user=self.request.user)
        return Prescription.objects.all()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


RAZORPAY_CHECKOUT = inline_serializer(
    "RazorpayCheckout",
    {
        "key_id": serializers.CharField(),
        "razorpay_order_id": serializers.CharField(),
        "amount": serializers.IntegerField(),
        "currency": serializers.CharField(),
    },
    allow_null=True,
)
ORDER_WITH_PAYMENT = inline_serializer("OrderWithPayment", {"order": OrderSerializer(), "payment": RAZORPAY_CHECKOUT})


def _start_payment(order):
    """Create a Razorpay order for an unpaid online order. Returns checkout params."""
    rp_order = razorpay.create_order(order.total, order.order_number, notes={"order_reference": str(order.reference)})
    order.razorpay_order_id = rp_order["id"]
    if order.payment_status == Order.PaymentStatus.FAILED:
        order.payment_status = Order.PaymentStatus.PENDING
    order.save(update_fields=["razorpay_order_id", "payment_status", "updated_at"])
    return {
        "key_id": settings.RAZORPAY_KEY_ID,
        "razorpay_order_id": rp_order["id"],
        "amount": rp_order["amount"],
        "currency": rp_order["currency"],
    }


class OrderViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Place orders (guest or signed-in), look them up by reference, and pay online."""

    serializer_class = OrderSerializer
    lookup_field = "reference"
    throttle_scope = "orders"

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_throttles(self):
        if self.action in ("create", "pay", "verify_payment", "pay_at_store"):
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items__product__brand", "items__product__images", "items__prescription")
        if getattr(self, "swagger_fake_view", False):
            return qs.none()
        if self.action == "list":
            return qs.filter(user=self.request.user)
        return qs

    def _response(self, order, payment=None, code=status.HTTP_200_OK):
        order = self.get_queryset().get(pk=order.pk)
        data = {"order": OrderSerializer(order, context={"request": self.request}).data, "payment": payment}
        return Response(data, status=code)

    @extend_schema(request=OrderCreateSerializer, responses={201: ORDER_WITH_PAYMENT})
    def create(self, request):
        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        payment = None
        if order.payment_method == Order.PaymentMethod.ONLINE:
            try:
                payment = _start_payment(order)
            except razorpay.RazorpayError:
                # Keep the order; the confirmation page offers "try again" or "pay at store".
                logger.exception("Could not start Razorpay payment for %s", order.order_number)
                order.payment_status = Order.PaymentStatus.FAILED
                order.save(update_fields=["payment_status", "updated_at"])
        else:
            _notify_new_order(order)
        return self._response(order, payment, status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=ORDER_WITH_PAYMENT)
    @action(detail=True, methods=["post"])
    def pay(self, request, reference=None):
        """Start (or retry) online payment for an unpaid order."""
        order = self.get_object()
        if order.status == Order.Status.CANCELLED:
            return Response({"detail": "This order was cancelled. Please place it again."},
                            status=status.HTTP_400_BAD_REQUEST)
        if order.payment_status == Order.PaymentStatus.PAID:
            return Response({"detail": "This order is already paid."}, status=status.HTTP_400_BAD_REQUEST)
        if not online_payments_available():
            return Response({"detail": "Online payment is unavailable. Pay at the store instead."},
                            status=status.HTTP_400_BAD_REQUEST)
        if order.payment_method == Order.PaymentMethod.STORE:
            order.payment_method = Order.PaymentMethod.ONLINE
            order.save(update_fields=["payment_method", "updated_at"])
        try:
            payment = _start_payment(order)
        except razorpay.RazorpayError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return self._response(order, payment)

    @extend_schema(request=None, responses=ORDER_WITH_PAYMENT)
    @action(detail=True, methods=["post"], url_path="pay-at-store")
    def pay_at_store(self, request, reference=None):
        """Switch an unpaid online order to pay-at-store."""
        order = self.get_object()
        if not order.awaiting_online_payment:
            return Response({"detail": "This order can't be switched."}, status=status.HTTP_400_BAD_REQUEST)
        order.payment_method = Order.PaymentMethod.STORE
        order.payment_status = Order.PaymentStatus.PENDING
        order.save(update_fields=["payment_method", "payment_status", "updated_at"])
        _notify_new_order(order)
        return self._response(order)

    @extend_schema(request=VerifyPaymentSerializer, responses=ORDER_WITH_PAYMENT)
    @action(detail=True, methods=["post"], url_path="verify-payment")
    def verify_payment(self, request, reference=None):
        order = self.get_object()
        data = VerifyPaymentSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        v = data.validated_data
        if v["razorpay_order_id"] != order.razorpay_order_id or not razorpay.verify_payment_signature(
            v["razorpay_order_id"], v["razorpay_payment_id"], v["razorpay_signature"]
        ):
            return Response({"detail": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=order.pk)
            if order.payment_status != Order.PaymentStatus.PAID:
                order.mark_paid(v["razorpay_payment_id"])
                _notify_new_order(order)
        return self._response(order)

    @extend_schema(request=None, responses=ORDER_WITH_PAYMENT)
    @action(detail=True, methods=["post"], url_path="payment-failed")
    def payment_failed(self, request, reference=None):
        """Record that the customer's payment attempt failed or was abandoned."""
        order = self.get_object()
        if order.awaiting_online_payment:
            order.payment_status = Order.PaymentStatus.FAILED
            order.save(update_fields=["payment_status", "updated_at"])
        return self._response(order)


class RazorpayWebhookView(APIView):
    """Backup confirmation from Razorpay (`payment.captured` / `order.paid`).

    Configure in Razorpay Dashboard → Webhooks with RAZORPAY_WEBHOOK_SECRET.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    @extend_schema(exclude=True)
    def post(self, request):
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        if not secret or not razorpay.verify_webhook_signature(
            request.body, request.headers.get("X-Razorpay-Signature"), secret
        ):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            payload = json.loads(request.body)
            payment = payload["payload"]["payment"]["entity"]
        except (ValueError, KeyError):
            return Response(status=status.HTTP_200_OK)
        if payload.get("event") in ("payment.captured", "order.paid"):
            with transaction.atomic():
                order = Order.objects.select_for_update().filter(razorpay_order_id=payment.get("order_id")).first()
                if order and order.payment_status != Order.PaymentStatus.PAID:
                    order.mark_paid(payment.get("id", ""))
                    _notify_new_order(order)
        elif payload.get("event") == "payment.failed":
            Order.objects.filter(
                razorpay_order_id=payment.get("order_id"), payment_status=Order.PaymentStatus.PENDING
            ).update(payment_status=Order.PaymentStatus.FAILED)
        return Response(status=status.HTTP_200_OK)


def _notify_new_order(order):
    lines = "\n".join(
        f"- {i.quantity} × {i.product_name} ({i.color_name}) + {i.lens_name or 'frame only'}"
        + (f" — Rx: {i.prescription}" if i.prescription else "")
        for i in order.items.select_related("prescription")
    )
    notify_doctor(
        f"New order {order.order_number} — ₹{order.total} ({order.get_payment_method_display()})",
        (
            f"Customer: {order.customer_name}\nPhone: {order.phone}\nEmail: {order.email or '-'}\n"
            f"Payment: {order.get_payment_method_display()} / {order.get_payment_status_display()}\n\n"
            f"{lines}\n\nNotes: {order.notes or '-'}\n\n"
            f"Open in admin: {admin_url(f'/admin/orders/order/{order.pk}/change/')}\n"
            f"WhatsApp customer: {whatsapp_link(order.phone, f'Hello {order.customer_name}, this is Pareena Eye Care Center about order {order.order_number}.')}"
        ),
    )
    notify_patient(
        f"Order {order.order_number} received — Pareena Eye Care Center",
        (
            f"Hello {order.customer_name},\n\nThank you for your order.\n\n{lines}\n\nTotal: ₹{order.total}\n"
            f"Payment: {order.get_payment_method_display()} ({order.get_payment_status_display()})\n\n"
            "We'll contact you when your glasses are ready to collect.\n\nPareena Eye Care Center"
        ),
        order.email,
    )
