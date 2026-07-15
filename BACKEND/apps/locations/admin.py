from django.contrib import admin
from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("code", "vehicle", "parking_zone", "statut", "heure_entree", "heure_sortie")
    list_filter = ("statut", "parking_zone__parking")
    search_fields = ("code", "vehicle__plaque", "nom_deposeur", "telephone")
