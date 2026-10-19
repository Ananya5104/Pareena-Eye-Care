from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.html import format_html

from .models import BusinessHours, ClinicSettings, Optometrist, StoreImage, Testimonial


@admin.register(ClinicSettings)
class ClinicSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Store", {"fields": ("name", "tagline", "description", "philosophy")}),
        (
            "Contact & location",
            {"fields": ("address", "phone", "whatsapp_number", "email", "google_maps_embed_url", "google_maps_link")},
        ),
        (
            "Appointment booking",
            {"fields": ("slot_duration_minutes", "booking_window_days", "min_notice_minutes")},
        ),
        ("Features", {"fields": ("consultations_enabled", "online_payments_enabled")}),
    )

    def has_add_permission(self, request):
        return not ClinicSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = ClinicSettings.load()
        return redirect(reverse("admin:core_clinicsettings_change", args=[obj.pk]))


@admin.register(BusinessHours)
class BusinessHoursAdmin(admin.ModelAdmin):
    list_display = ("weekday", "open_time", "close_time", "is_closed")
    list_editable = ("open_time", "close_time", "is_closed")
    ordering = ("weekday",)


@admin.register(Optometrist)
class OptometristAdmin(admin.ModelAdmin):
    list_display = ("name", "qualifications", "experience_years", "is_active", "display_order")
    list_editable = ("is_active", "display_order")


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("patient_name", "rating", "is_published", "display_order")
    list_editable = ("is_published", "display_order")


@admin.register(StoreImage)
class StoreImageAdmin(admin.ModelAdmin):
    list_display = ("preview", "caption", "show_on_home", "display_order")
    list_editable = ("caption", "show_on_home", "display_order")

    @admin.display(description="Image")
    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:48px;border-radius:6px" />', obj.image.url)
        return "—"
