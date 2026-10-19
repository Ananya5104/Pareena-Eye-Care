from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, PrescriptionViewSet, RazorpayWebhookView

router = DefaultRouter()
router.register("prescriptions", PrescriptionViewSet, basename="prescription")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = router.urls + [
    path("payments/razorpay/webhook/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
]
