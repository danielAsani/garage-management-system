from rest_framework import serializers
from .models import Vehicle, VehicleType, VehiclePhoto


class VehicleSerializer(serializers.ModelSerializer):
    vehicle_type_name = serializers.CharField(source = "vehicle_type.name", read_only = True)
    class Meta : 
        model = Vehicle
        fields = [
            "id",
            "plaque",
            "vehicle_type",
            "vehicle_type_name",
            "marque",
            "couleur",
            "created_at",
            "updated_at",
        ]




class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = "__all__"


class VehiclePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehiclePhoto
        fields = "__all__"
