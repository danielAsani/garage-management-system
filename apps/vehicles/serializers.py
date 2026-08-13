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
    def validate(self, attrs):
        attrs = super().validate(attrs)
        vehicle = attrs.get("vehicle") or getattr(self.instance, "vehicle", None)
        if vehicle:
            queryset = VehiclePhoto.objects.filter(vehicle=vehicle)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.count() >= 4:
                raise serializers.ValidationError("Un vehicule ne peut pas avoir plus de 4 photos.")
        return attrs

    class Meta:
        model = VehiclePhoto
        fields = "__all__"
