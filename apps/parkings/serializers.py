from rest_framework import serializers
from .models import Parking, ParkingZone

class ParkingSerializer(serializers.ModelSerializer) : 
    class Meta : 
        model = Parking
        fields = "__all__"

class ParkingZoneSerializer(serializers.ModelSerializer) : 
    parking_name = serializers.CharField(source = "parking.name", read_only = True)
    vehicle_type_name = serializers.CharField(source = "vehicle_type.name", read_only = True)

    class Meta : 
        model = ParkingZone
        fields = [
            "id", 
            "name",
            "parking", 
            "parking_name", 
            "vehicle_type",
            "vehicle_type_name"
        ]