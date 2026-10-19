from django.contrib import admin, messages
from django.utils.html import format_html

from apps.core.notifications import notify_patient
from apps.core.utils import whatsapp_link

from .models import Order, OrderItem, Prescription


def prescription_table(p):
    def fmt(value):
        return "—" if value is None else ("0.00" if value == 0 else f"{value:+.2f}")

    html = format_html(
        "<table><tr><th></th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th></tr>"
        "<tr><td>Right (OD)</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td></tr>"
        "<tr><td>Left (OS)</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td></tr></table>"
        "<p>{} · PD: {} · Date on prescription: {}</p>",
        fmt(p.right_sph), fmt(p.right_cyl), p.right_axis or "—", fmt(p.right_add),
        fmt(p.left_sph), fmt(p.left_cyl), p.left_axis or "—", fmt(p.left_add),
        p.patient_name, p.pupillary_distance or "—", p.prescription_date or "—",
    )
    if p.upload:
        html += format_html('<a href="{}" target="_blank" rel="noopener">View uploaded prescription</a>', p.upload.url)
    return html


class OrderItemInline(admin.StackedInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = (("product_name", "color_name", "quantity"), ("lens_name", "frame_price", "lens_price"), "rx")
    readonly_fields = ("product_name", "color_name", "quantity", "lens_name", "frame_price", "lens_price", "rx")

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Prescription")
    def rx(self, obj):
        if obj.prescription:
            return prescription_table(obj.prescription)
        return "Plain lenses (no power)" if obj.lens_name else "Frame only / sunglasses"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "customer_name", "phone", "total", "payment_method", "payment_status",
                    "status", "created_at", "whatsapp")
    list_filter = ("status", "payment_method", "payment_status", "created_at")
    search_fields = ("order_number", "customer_name", "phone", "email", "razorpay_payment_id")
    readonly_fields = ("order_number", "reference", "user", "total", "razorpay_order_id", "razorpay_payment_id",
                       "paid_at", "created_at", "updated_at")
    inlines = [OrderItemInline]
    actions = ["mark_confirmed", "mark_in_lab", "mark_ready", "mark_completed", "mark_paid_in_store", "cancel_orders"]
    fieldsets = (
        (None, {"fields": ("order_number", "reference", "status", "notes")}),
        ("Customer", {"fields": ("customer_name", "phone", "email", "user")}),
        ("Payment", {"fields": ("payment_method", "payment_status", "total", "razorpay_order_id",
                                "razorpay_payment_id", "paid_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Cancelling from the edit form must also put stock back.
        if change and obj.status == Order.Status.CANCELLED and not obj.stock_released:
            obj.cancel()

    @admin.display(description="WhatsApp")
    def whatsapp(self, obj):
        msg = f"Hello {obj.customer_name}, this is Pareena Eye Care Center about your order {obj.order_number}."
        return format_html('<a href="{}" target="_blank" rel="noopener">Message</a>', whatsapp_link(obj.phone, msg))

    def _update(self, request, queryset, label, **fields):
        count = queryset.exclude(status=Order.Status.CANCELLED).update(**fields)
        self.message_user(request, f"{count} order(s) {label}.", messages.SUCCESS)

    @admin.action(description="Mark confirmed")
    def mark_confirmed(self, request, queryset):
        self._update(request, queryset, "confirmed", status=Order.Status.CONFIRMED)

    @admin.action(description="Mark in the lab")
    def mark_in_lab(self, request, queryset):
        self._update(request, queryset, "marked in the lab", status=Order.Status.IN_PROGRESS)

    @admin.action(description="Mark ready to collect (emails customer)")
    def mark_ready(self, request, queryset):
        for order in queryset.exclude(status=Order.Status.CANCELLED):
            order.status = Order.Status.READY
            order.save(update_fields=["status", "updated_at"])
            due = "nothing (paid online)" if order.payment_status == "paid" else f"₹{order.total}"
            notify_patient(
                f"Your order {order.order_number} is ready — Pareena Eye Care Center",
                f"Hello {order.customer_name},\n\nYour glasses are ready to collect at the store.\n"
                f"Amount due: {due}\n\nPareena Eye Care Center",
                order.email,
            )
        self.message_user(request, "Selected orders marked ready.", messages.SUCCESS)

    @admin.action(description="Mark collected (completed)")
    def mark_completed(self, request, queryset):
        self._update(request, queryset, "completed", status=Order.Status.COMPLETED)

    @admin.action(description="Mark paid (payment received in store)")
    def mark_paid_in_store(self, request, queryset):
        self._update(request, queryset, "marked paid", payment_status=Order.PaymentStatus.PAID)

    @admin.action(description="Cancel orders and restock")
    def cancel_orders(self, request, queryset):
        for order in queryset:
            order.cancel()
        self.message_user(request, "Selected orders cancelled; stock restored.", messages.WARNING)


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("patient_name", "summary", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("patient_name", "reference", "user__email")
    readonly_fields = ("reference", "table", "created_at", "updated_at")

    @admin.display(description="Prescription")
    def table(self, obj):
        return prescription_table(obj) if obj.pk else "—"
