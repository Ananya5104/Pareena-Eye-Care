import datetime

from django.db import IntegrityError, transaction
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.models import BusinessHours, ClinicSettings
from apps.core.notifications import admin_url, notify_doctor, notify_patient
from apps.core.utils import whatsapp_link

from .models import Appointment, BlockedSlot
from .serializers import AppointmentSerializer, DaySlotsSerializer
from .slots import bookable_date_range, generate_slots


class AppointmentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Book an eye test (anyone) and list your own bookings (signed-in users)."""

    serializer_class = AppointmentSerializer
    throttle_scope = "appointments"

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_throttles(self):
        # Only limit booking attempts, not slot lookups.
        if self.action == "create":
            return super().get_throttles()
        return []

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Appointment.objects.none()
        return Appointment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        try:
            with transaction.atomic():
                appointment = serializer.save(user=user)
        except IntegrityError:
            # Two people raced for the same slot; the DB constraint caught it.
            raise serializers.ValidationError({"time": ["This slot was just booked. Please pick another time."]})
        _notify_new_appointment(appointment)

    @extend_schema(
        parameters=[OpenApiParameter("date", str, description="YYYY-MM-DD", required=True)],
        responses=DaySlotsSerializer,
    )
    @action(detail=False, methods=["get"])
    def slots(self, request):
        """Time slots for one day, with availability."""
        try:
            date = datetime.date.fromisoformat(request.query_params.get("date", ""))
        except ValueError:
            return Response({"date": ["Use YYYY-MM-DD."]}, status=status.HTTP_400_BAD_REQUEST)
        settings_obj = ClinicSettings.load()
        data = {
            "date": date,
            "slot_duration_minutes": settings_obj.slot_duration_minutes,
            "slots": generate_slots(date, settings_obj),
        }
        return Response(DaySlotsSerializer(data).data)

    @extend_schema(
        responses=inline_serializer(
            "BookingCalendar",
            {
                "first_date": serializers.DateField(),
                "last_date": serializers.DateField(),
                "closed_weekdays": serializers.ListField(child=serializers.IntegerField()),
                "closed_dates": serializers.ListField(child=serializers.DateField()),
            },
        )
    )
    @action(detail=False, methods=["get"])
    def calendar(self, request):
        """Bookable date window plus closed weekdays/dates, for the date picker."""
        first, last = bookable_date_range()
        closed_weekdays = [d for d, _ in BusinessHours.WEEKDAYS if BusinessHours.for_weekday(d) is None]
        closed_dates = BlockedSlot.objects.filter(
            date__range=(first, last), start_time__isnull=True, end_time__isnull=True
        ).values_list("date", flat=True)
        return Response(
            {
                "first_date": first,
                "last_date": last,
                "closed_weekdays": closed_weekdays,
                "closed_dates": sorted(set(closed_dates)),
            }
        )


def _notify_new_appointment(a):
    when = f"{a.date:%a, %d %b %Y} at {a.time:%I:%M %p}"
    notify_doctor(
        f"New eye test booking: {a.name} — {when}",
        (
            f"Name: {a.name}\nPhone: {a.phone}\nEmail: {a.email or '-'}\nWhen: {when}\n"
            f"Reason: {a.reason}\n\n"
            f"Review in admin: {admin_url(f'/admin/appointments/appointment/{a.pk}/change/')}\n"
            f"WhatsApp patient: {whatsapp_link(a.phone, f'Hello {a.name}, this is Pareena Eye Care Center regarding your eye test on {when}.')}"
        ),
    )
    notify_patient(
        "We received your appointment request — Pareena Eye Care Center",
        (
            f"Hello {a.name},\n\nThank you for booking an eye test on {when}. "
            "We will confirm your appointment shortly.\n\nPareena Eye Care Center"
        ),
        a.email,
    )
