from django.contrib import admin
from .models import Parking, ParkingZone


@admin.register(Parking)
class ParkingAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name",)


@admin.register(ParkingZone)
class ParkingZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "parking", "vehicle_type")
    list_filter = ("parking", "vehicle_type")
    search_fields = ("name", "parking__name", "vehicle_type__name")
