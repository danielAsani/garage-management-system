from rest_framework import serializers
from .models import ParkingZone

class ParkingZoneSerializer(serializers.ModelSerializer) : 
    vehicle_type_name = serializers.CharField(source = "vehicle_type.name", read_only = True)

    class Meta : 
        model = ParkingZone
        fields = [
            "id", 
            "name",
            "vehicle_type",
            "vehicle_type_name"
        ]
