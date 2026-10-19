from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClinicSettings, Optometrist, StoreImage, Testimonial
from .reviews import get_reviews
from .serializers import (
    ClinicSettingsSerializer,
    OptometristSerializer,
    StoreImageSerializer,
    TestimonialSerializer,
)


class ClinicInfoView(APIView):
    """Everything the Home and About pages need in a single request."""

    @extend_schema(
        responses=inline_serializer(
            "ClinicInfo",
            {
                "clinic": ClinicSettingsSerializer(),
                "optometrists": OptometristSerializer(many=True),
                "testimonials": TestimonialSerializer(many=True),
                "gallery": StoreImageSerializer(many=True),
            },
        )
    )
    def get(self, request):
        ctx = {"request": request}
        return Response(
            {
                "clinic": ClinicSettingsSerializer(ClinicSettings.load(), context=ctx).data,
                "optometrists": OptometristSerializer(
                    Optometrist.objects.filter(is_active=True), many=True, context=ctx
                ).data,
                "testimonials": TestimonialSerializer(
                    Testimonial.objects.filter(is_published=True)[:12], many=True, context=ctx
                ).data,
                "gallery": StoreImageSerializer(
                    StoreImage.objects.filter(show_on_home=True), many=True, context=ctx
                ).data,
            }
        )


class ReviewsView(APIView):
    """Google rating and latest reviews, or null when not connected."""

    @extend_schema(
        responses=inline_serializer(
            "GoogleReviews",
            {
                "rating": serializers.FloatField(),
                "total": serializers.IntegerField(),
                "url": serializers.URLField(),
                "reviews": serializers.ListField(child=serializers.DictField()),
            },
            allow_null=True,
        )
    )
    def get(self, request):
        return Response(get_reviews())


class HealthView(APIView):
    @extend_schema(responses=inline_serializer("Health", {"status": serializers.CharField()}))
    def get(self, request):
        return Response({"status": "ok"})
