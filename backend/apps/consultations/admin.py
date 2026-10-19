from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, redirect
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.views.decorators.http import require_POST

from apps.core.utils import whatsapp_link

from . import meet, services
from .models import ConsultationPhoto, ConsultationRequest

STATUS_COLORS = {
    "pending": "#b7791f",
    "approved": "#2386c8",
    "completed": "#2f855a",
    "rejected": "#9b2c2c",
}


class ConsultationPhotoInline(admin.TabularInline):
    model = ConsultationPhoto
    extra = 0
    can_delete = False
    fields = ("preview",)
    readonly_fields = ("preview",)

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Photo")
    def preview(self, obj):
        return format_html(
            '<a href="{0}" target="_blank" rel="noopener"><img src="{0}" style="max-height:240px;border-radius:8px" /></a>',
            obj.image.url,
        )


@admin.register(ConsultationRequest)
class ConsultationRequestAdmin(admin.ModelAdmin):
    list_display = ("name", "issues_list", "status_badge", "phone", "preferred_time", "photo_count", "created_at",
                    "send_whatsapp")
    list_filter = ("status", "preferred_time", "created_at")
    inlines = [ConsultationPhotoInline]
    search_fields = ("name", "phone", "email", "issue_description")
    readonly_fields = (
        "reference",
        "user",
        "issues_list",
        "workflow_buttons",
        "send_whatsapp",
        "google_event_id",
        "link_sent_via",
        "approved_at",
        "link_sent_at",
        "completed_at",
        "rejected_at",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        ("Actions", {"fields": ("workflow_buttons", "send_whatsapp")}),
        ("Patient", {"fields": ("name", "phone", "email", "user", "reference")}),
        ("Issue", {"fields": ("issues_list", "since", "eye", "preferred_time", "issue_description")}),
        (
            "Consultation",
            {
                "fields": ("status", "scheduled_for", "meet_link", "patient_notes", "doctor_notes",
                           "rejection_reason"),
                "description": (
                    "Set 'Scheduled for' then click Approve. A Meet link is generated automatically when "
                    "Google Calendar is configured; otherwise paste one into 'Meet link' (create it at "
                    "meet.google.com/new) and save before approving."
                ),
            },
        ),
        (
            "Timestamps",
            {"fields": ("google_event_id", "link_sent_via", "approved_at", "link_sent_at", "completed_at",
                        "rejected_at", "created_at", "updated_at")},
        ),
    )
    actions = ["approve_selected", "complete_selected", "reject_selected"]

    # ----- display helpers -----
    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        return format_html(
            '<b style="color:{}">{}</b>', STATUS_COLORS.get(obj.status, "#333"), obj.get_status_display()
        )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("photos")

    @admin.display(description="Issues")
    def issues_list(self, obj):
        return obj.issues_display

    @admin.display(description="Photos")
    def photo_count(self, obj):
        return len(obj.photos.all())

    @admin.display(description="WhatsApp")
    def send_whatsapp(self, obj):
        if not obj.pk:
            return "—"
        link = services.patient_whatsapp_link(obj)
        if link:
            return format_html(
                '<a class="button" style="background:#25D366;color:#fff;padding:4px 10px;border-radius:4px" '
                'href="{}" target="_blank" rel="noopener">Send Meet link on WhatsApp</a>',
                link,
            )
        return format_html(
            '<a href="{}" target="_blank" rel="noopener">Chat</a>',
            whatsapp_link(obj.phone, f"Hello {obj.name}, this is Pareena Eye Care Center about your consultation request."),
        )

    @admin.display(description="Workflow")
    def workflow_buttons(self, obj):
        if not obj.pk:
            return "—"
        buttons = []
        if obj.status in ("pending", "rejected"):
            label = "Approve & generate Meet link" if not obj.meet_link else "Approve & send link"
            buttons.append(("approve", label, "#2386c8"))
        if obj.status == "approved":
            buttons.append(("approve", "Resend link", "#233b7e"))
            buttons.append(("complete", "Mark completed", "#2f855a"))
        if obj.status in ("pending", "approved"):
            buttons.append(("reject", "Reject", "#9b2c2c"))
        # Buttons submit the surrounding change form (which carries the CSRF token) via POST.
        html = "".join(
            format_html(
                '<button type="submit" formaction="{}" formmethod="post" '
                'style="background:{};color:#fff;border:0;padding:6px 12px;border-radius:4px;'
                'margin-right:6px;cursor:pointer">{}</button>',
                reverse(f"admin:consultation-{name}", args=[obj.pk]),
                color,
                label,
            )
            for name, label, color in buttons
        )
        if not meet.is_configured():
            html += (
                '<p style="margin-top:8px;color:#666">Google Calendar not configured. Paste a link from '
                '<a href="https://meet.google.com/new" target="_blank" rel="noopener">meet.google.com/new</a> '
                "into “Meet link” and save before approving.</p>"
            )
        return mark_safe(html) if html else "—"

    # ----- custom URLs for the buttons -----
    def get_urls(self):
        custom = [
            path("<int:pk>/approve/", self.admin_site.admin_view(require_POST(self.approve_view)), name="consultation-approve"),
            path("<int:pk>/complete/", self.admin_site.admin_view(require_POST(self.complete_view)), name="consultation-complete"),
            path("<int:pk>/reject/", self.admin_site.admin_view(require_POST(self.reject_view)), name="consultation-reject"),
        ]
        return custom + super().get_urls()

    def _back(self, pk):
        return redirect(reverse("admin:consultations_consultationrequest_change", args=[pk]))

    def _check_perm(self, request, obj):
        if not self.has_change_permission(request, obj):
            raise PermissionDenied

    def approve_view(self, request, pk):
        obj = get_object_or_404(ConsultationRequest, pk=pk)
        self._check_perm(request, obj)
        try:
            for note in services.approve(obj):
                self.message_user(request, note, messages.SUCCESS)
        except meet.MeetLinkError as exc:
            self.message_user(request, str(exc), messages.ERROR)
        return self._back(pk)

    def complete_view(self, request, pk):
        obj = get_object_or_404(ConsultationRequest, pk=pk)
        self._check_perm(request, obj)
        services.complete(obj)
        self.message_user(request, "Marked as completed.", messages.SUCCESS)
        return self._back(pk)

    def reject_view(self, request, pk):
        obj = get_object_or_404(ConsultationRequest, pk=pk)
        self._check_perm(request, obj)
        services.reject(obj)
        self.message_user(request, "Request rejected and patient notified (if email given).", messages.WARNING)
        return self._back(pk)

    # ----- bulk actions -----
    @admin.action(description="Approve & send Meet link")
    def approve_selected(self, request, queryset):
        ok = 0
        for obj in queryset:
            try:
                services.approve(obj)
                ok += 1
            except meet.MeetLinkError as exc:
                self.message_user(request, f"{obj.name}: {exc}", messages.ERROR)
        if ok:
            self.message_user(request, f"Approved {ok} request(s).", messages.SUCCESS)

    @admin.action(description="Mark as completed")
    def complete_selected(self, request, queryset):
        for obj in queryset:
            services.complete(obj)

    @admin.action(description="Reject (notifies patient by email)")
    def reject_selected(self, request, queryset):
        for obj in queryset:
            services.reject(obj)
