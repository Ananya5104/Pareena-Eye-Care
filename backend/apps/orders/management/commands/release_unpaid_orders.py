import datetime

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.orders.models import Order


class Command(BaseCommand):
    help = "Cancel online-payment orders left unpaid and return their reserved stock. Run every ~15 min (cron)."

    def add_arguments(self, parser):
        default = int(getattr(settings, "UNPAID_ORDER_TIMEOUT_MINUTES", 30))
        parser.add_argument("--minutes", type=int, default=default)

    def handle(self, *args, minutes, **options):
        cutoff = timezone.now() - datetime.timedelta(minutes=minutes)
        stale = Order.objects.filter(
            payment_method=Order.PaymentMethod.ONLINE,
            payment_status__in=[Order.PaymentStatus.PENDING, Order.PaymentStatus.FAILED],
            created_at__lt=cutoff,
        ).exclude(status=Order.Status.CANCELLED)
        count = 0
        for order in stale:
            order.cancel()
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Released {count} unpaid order(s)."))
