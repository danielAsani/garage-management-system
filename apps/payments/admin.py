from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("location", "amount", "method", "status", "payment_identifier", "paid_at")
    list_filter = ("method", "status", "paid_at")
    search_fields = ("location__code", "location__vehicle__plaque", "payment_identifier")
