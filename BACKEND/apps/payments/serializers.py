from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    location_code = serializers.CharField(source="location.code", read_only=True)
    vehicle_plaque = serializers.CharField(source="location.vehicle.plaque", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "location",
            "location_code",
            "vehicle_plaque",
            "amount",
            "method",
            "status",
            "paid_at",
            "created_at",
            "updated_at",
        ]