from django.contrib import admin
from django.utils.html import format_html

from .models import Brand, LensType, Product, ProductImage, ProductVariant


def _thumb(image, height=48):
    if image:
        return format_html('<img src="{}" style="height:{}px;border-radius:6px" />', image.url, height)
    return "—"


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "logo_preview", "is_featured", "display_order")
    list_editable = ("is_featured", "display_order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)

    @admin.display(description="Logo")
    def logo_preview(self, obj):
        return _thumb(obj.logo, 32)


@admin.register(LensType)
class LensTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "works_without_power", "requires_addition", "ready_in", "is_active",
                    "show_in_guide", "display_order")
    list_editable = ("price", "is_active", "show_in_guide", "display_order")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ("color_name", "color_hex", "sku", "stock", "is_active")


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("preview", "image", "view", "variant", "alt_text", "display_order")
    readonly_fields = ("preview",)

    @admin.display(description="Preview")
    def preview(self, obj):
        return _thumb(obj.image, 60)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Only offer this product's own colour variants.
        if db_field.name == "variant":
            object_id = request.resolver_match.kwargs.get("object_id")
            kwargs["queryset"] = (
                ProductVariant.objects.filter(product_id=object_id) if object_id else ProductVariant.objects.none()
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("thumb", "name", "brand", "category", "price", "total_stock", "is_active", "is_featured")
    list_display_links = ("thumb", "name")
    list_editable = ("price", "is_active", "is_featured")
    list_filter = ("brand", "category", "gender", "shape", "frame_type", "is_active", "is_featured")
    search_fields = ("name", "model_number", "brand__name", "variants__sku")
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("compatible_lens_types",)
    inlines = [ProductVariantInline, ProductImageInline]
    list_select_related = ("brand",)
    fieldsets = (
        (None, {"fields": ("name", "slug", "brand", "model_number", "category", "gender", "description")}),
        ("Frame", {"fields": ("frame_type", "shape", "material", "hinges", "weight_g", "fit",
                              ("lens_width_mm", "bridge_width_mm", "temple_length_mm"))}),
        ("Pricing", {"fields": ("price", "mrp")}),
        ("Lens compatibility", {"fields": ("progressive_compatible", ("min_sph", "max_sph"),
                                           "compatible_lens_types")}),
        ("Visibility", {"fields": ("is_active", "is_featured")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("images", "variants")

    @admin.display(description="")
    def thumb(self, obj):
        images = list(obj.images.all())
        return _thumb(images[0].image if images else None)

    @admin.display(description="Stock")
    def total_stock(self, obj):
        stock = obj.stock
        color = "#9b2c2c" if stock == 0 else ("#b7791f" if stock < 3 else "#2f855a")
        return format_html('<b style="color:{}">{}</b>', color, stock)
