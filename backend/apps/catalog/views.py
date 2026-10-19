from django.db.models import Count, Prefetch, Q
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Brand, LensType, Product, ProductVariant
from .serializers import BrandSerializer, LensTypeSerializer, ProductDetailSerializer, ProductListSerializer


class ProductPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 200


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BrandSerializer
    lookup_field = "slug"
    pagination_class = None
    queryset = Brand.objects.annotate(product_count=Count("products", filter=Q(products__is_active=True)))
    filterset_fields = ["is_featured"]


class LensTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """Lens options. `?guide=true` returns only those shown on the Lens Guide page."""

    serializer_class = LensTypeSerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        qs = LensType.objects.filter(is_active=True)
        if self.request.query_params.get("guide") in ("1", "true"):
            qs = qs.filter(show_in_guide=True)
        return qs


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Frames & sunglasses. Filter by brand, category, gender, shape, frame_type, fit, price range."""

    lookup_field = "slug"
    filterset_class = ProductFilter
    pagination_class = ProductPagination
    search_fields = ["name", "brand__name", "model_number", "material"]
    ordering_fields = ["price", "created_at", "name"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("brand")
            .prefetch_related(
                "images",
                Prefetch("variants", queryset=ProductVariant.objects.order_by("id")),
                "compatible_lens_types",
            )
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @extend_schema(
        responses=inline_serializer(
            "ProductFacets",
            {
                "brands": BrandSerializer(many=True),
                "genders": serializers.ListField(child=serializers.DictField()),
                "shapes": serializers.ListField(child=serializers.DictField()),
                "frame_types": serializers.ListField(child=serializers.DictField()),
            },
        )
    )
    @action(detail=False, methods=["get"], pagination_class=None)
    def facets(self, request):
        """Filter options for the shop sidebar."""

        def opts(choices):
            return [{"value": v, "label": label} for v, label in choices]

        brands = Brand.objects.annotate(
            product_count=Count("products", filter=Q(products__is_active=True))
        ).filter(product_count__gt=0)
        return Response(
            {
                "brands": BrandSerializer(brands, many=True, context={"request": request}).data,
                "genders": opts(Product.Gender.choices),
                "shapes": opts(Product.Shape.choices),
                "frame_types": opts(Product.FrameType.choices),
            }
        )
