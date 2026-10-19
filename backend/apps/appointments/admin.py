from django.contrib import admin, messages
from django.utils.html import format_html

from apps.core.notifications import notify_patient
from apps.core.utils import whatsapp_link

from .models import Appointment, BlockedSlot

STATUS_COLORS = {
    "pending": "#b7791f",
    "approved": "#2386c8",
    "completed": "#2f855a",
    "cancelled": "#9b2c2c",
}


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("name", "date", "time", "status_badge", "phone", "whatsapp", "created_at")
    list_filter = ("status", "date")
    search_fields = ("name", "phone", "email", "reason")
    date_hierarchy = "date"
    ordering = ("-date", "time")
    readonly_fields = ("created_at", "updated_at", "user", "duration_minutes")
    actions = ["approve", "cancel", "mark_completed"]
    fieldsets = (
        ("Patient", {"fields": ("name", "phone", "email", "user")}),
        ("Booking", {"fields": ("date", "time", "duration_minutes", "for_whom", "reason", "notes", "status")}),
        ("Internal", {"fields": ("admin_notes", "created_at", "updated_at")}),
    )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        return format_html(
            '<b style="color:{}">{}</b>', STATUS_COLORS.get(obj.status, "#333"), obj.get_status_display()
        )

    @admin.display(description="WhatsApp")
    def whatsapp(self, obj):
        msg = (
            f"Hello {obj.name}, this is Pareena Eye Care Center. Your eye test is "
            f"{obj.get_status_display().lower()} for {obj.date:%a, %d %b} at {obj.time:%I:%M %p}."
        )
        return format_html('<a href="{}" target="_blank" rel="noopener">Message</a>', whatsapp_link(obj.phone, msg))

    def _set_status(self, request, queryset, status, email_subject=None, email_body=None):
        updated = 0
        for appt in queryset:
            appt.status = status
            appt.save(update_fields=["status", "updated_at"])
            updated += 1
            if email_subject:
                notify_patient(email_subject, email_body(appt), appt.email)
        self.message_user(request, f"{updated} appointment(s) marked {status}.", messages.SUCCESS)

    @admin.action(description="Approve selected appointments (emails patient)")
    def approve(self, request, queryset):
        self._set_status(
            request,
            queryset.exclude(status=Appointment.Status.CANCELLED),
            Appointment.Status.APPROVED,
            "Your eye test is confirmed — Pareena Eye Care Center",
            lambda a: (
                f"Hello {a.name},\n\nYour eye test is confirmed for {a.date:%A, %d %B %Y} at "
                f"{a.time:%I:%M %p}. Please bring your current glasses or lenses if you have them.\n\n"
                "Pareena Eye Care Center"
            ),
        )

    @admin.action(description="Cancel selected appointments (frees the slot, emails patient)")
    def cancel(self, request, queryset):
        self._set_status(
            request,
            queryset,
            Appointment.Status.CANCELLED,
            "Your appointment was cancelled — Pareena Eye Care Center",
            lambda a: (
                f"Hello {a.name},\n\nYour eye test on {a.date:%d %B %Y} at {a.time:%I:%M %p} has been "
                "cancelled. Please book another slot on our website or call us.\n\nPareena Eye Care Center"
            ),
        )

    @admin.action(description="Mark selected as completed")
    def mark_completed(self, request, queryset):
        self._set_status(request, queryset, Appointment.Status.COMPLETED)


@admin.register(BlockedSlot)
class BlockedSlotAdmin(admin.ModelAdmin):
    list_display = ("date", "start_time", "end_time", "reason")
    list_filter = ("date",)
    ordering = ("-date",)
