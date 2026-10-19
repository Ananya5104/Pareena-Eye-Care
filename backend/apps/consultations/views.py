from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, parsers, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.core.models import ClinicSettings

from . import services
from .models import ConsultationRequest
from .serializers import ConsultationRequestSerializer, ConsultationStatusSerializer


class ConsultationViewSet(
    mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    """
    create:   Submit a video consultation request (multipart, up to 3 photos). Rate limited.
    retrieve: Check status by the reference UUID returned on create.
    list:     Your own requests (signed-in users only).
    lookup:   Statuses for several references at once (for guests' saved requests).
    """

    lookup_field = "reference"
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    throttle_scope = "consultations"

    def get_serializer_class(self):
        if self.action == "create":
            return ConsultationRequestSerializer
        return ConsultationStatusSerializer

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_throttles(self):
        if self.action == "create":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ConsultationRequest.objects.none()
        qs = ConsultationRequest.objects.prefetch_related("photos")
        if self.action == "list":
            return qs.filter(user=self.request.user)
        return qs

    def perform_create(self, serializer):
        if not ClinicSettings.load().consultations_enabled:
            raise serializers.ValidationError({"detail": "Video consultations are unavailable right now."})
        user = self.request.user if self.request.user.is_authenticated else None
        consultation = serializer.save(user=user)
        services.notify_new_request(consultation)

    @extend_schema(
        parameters=[OpenApiParameter("refs", str, description="Comma-separated references (max 20)", required=True)],
        responses=ConsultationStatusSerializer(many=True),
    )
    @action(detail=False, methods=["get"])
    def lookup(self, request):
        refs = [r.strip() for r in request.query_params.get("refs", "").split(",") if r.strip()][:20]
        valid = []
        for ref in refs:
            try:
                valid.append(str(serializers.UUIDField().to_internal_value(ref)))
            except serializers.ValidationError:
                continue
        qs = self.get_queryset().filter(reference__in=valid)
        return Response(ConsultationStatusSerializer(qs, many=True).data)
