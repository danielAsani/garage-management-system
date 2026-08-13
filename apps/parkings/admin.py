from django.contrib import admin
from .models import ParkingZone


@admin.register(ParkingZone)
class ParkingZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "vehicle_type")
    list_filter = ("vehicle_type",)
    search_fields = ("name", "vehicle_type__name")
