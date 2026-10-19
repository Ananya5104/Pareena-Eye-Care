from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Brand, LensType, Product, ProductImage, ProductVariant


def absolute_url(request, file_field):
    if not file_field:
        return None
    url = file_field.url
    return request.build_absolute_uri(url) if request and url.startswith("/") else url


class BrandSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo", "description", "product_count"]


class LensTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LensType
        fields = [
            "id",
            "slug",
            "name",
            "short_description",
            "description",
            "good_for",
            "ready_in",
            "price",
            "works_without_power",
            "requires_addition",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "view", "alt_text", "variant"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "color_name", "color_hex", "stock"]


class ProductListSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source="brand.name")
    brand_slug = serializers.CharField(source="brand.slug")
    image = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()
    size_label = serializers.CharField(read_only=True)
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "brand",
            "brand_slug",
            "category",
            "gender",
            "shape",
            "frame_type",
            "fit",
            "size_label",
            "price",
            "mrp",
            "image",
            "variants",
            "in_stock",
            "is_featured",
        ]

    @extend_schema_field(OpenApiTypes.URI)
    def get_image(self, obj):
        images = list(obj.images.all())
        return absolute_url(self.context.get("request"), images[0].image) if images else None

    @extend_schema_field(ProductVariantSerializer(many=True))
    def get_variants(self, obj):
        return ProductVariantSerializer([v for v in obj.variants.all() if v.is_active], many=True).data

    def get_in_stock(self, obj) -> bool:
        return any(v.is_active and v.stock > 0 for v in obj.variants.all())


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True)
    lens_types = serializers.SerializerMethodField()
    hinges_display = serializers.CharField(source="get_hinges_display")
    frame_type_display = serializers.CharField(source="get_frame_type_display")
    power_range = serializers.CharField(read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "model_number",
            "material",
            "hinges",
            "hinges_display",
            "frame_type_display",
            "weight_g",
            "description",
            "lens_width_mm",
            "bridge_width_mm",
            "temple_length_mm",
            "progressive_compatible",
            "min_sph",
            "max_sph",
            "power_range",
            "images",
            "lens_types",
        ]

    @extend_schema_field(serializers.ListField(child=serializers.IntegerField()))
    def get_lens_types(self, obj):
        """IDs of lens types this frame can take."""
        if obj.category != Product.Category.EYEGLASSES:
            return []
        return list(obj.available_lens_types().values_list("id", flat=True))
