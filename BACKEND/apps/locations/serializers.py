from rest_framework import serializers
from .models import Location

class LocationSerializer(serializers.ModelSerializer) : 
    vehicle_plaque = serializers.CharField(source="vehicle.plaque", read_only= True)
    vehicle_marque = serializers.CharField(source= "vehicle.marque", read_only= True)
    vehicle_couleur = serializers.CharField(source="vehicle.couleur", read_only= True)
    vehicle_type_name = serializers.CharField(source="vehicle.vehicle_type.name", read_only= True)
    parking_name = serializers.CharField(source="parking_zone.parking.name", read_only=True)
    parking_zone_name = serializers.CharField(source="parking_zone.name", read_only=True)

    class Meta :
        model = Location
        fields = [
            "id",
            "code",
            "vehicle",
            "parking_zone",
            "parking_name",
            "parking_zone_name",
            "vehicle_plaque",
            "vehicle_type_name",
            "vehicle_marque",
            "vehicle_couleur",
            "nom_deposeur",
            "telephone",
            "heure_entree",
            "heure_sortie",
            "statut"

        ]
