from django.contrib import admin
from .models import Vehicle, VehiclePhoto, VehicleType


@admin.register(VehicleType)
class VehicleTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "tarif_hours", "created_at", "updated_at")
    search_fields = ("name",)


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plaque", "vehicle_type", "marque", "couleur", "created_at")
    list_filter = ("vehicle_type",)
    search_fields = ("plaque", "marque", "couleur")


@admin.register(VehiclePhoto)
class VehiclePhotoAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "image", "updated_at")
    list_filter = ("updated_at",)
    search_fields = ("vehicle__plaque",)
