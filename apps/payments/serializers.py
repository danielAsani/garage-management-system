from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    location_code = serializers.CharField(source="location.code", read_only=True)
    vehicle_plaque = serializers.CharField(source="location.vehicle.plaque", read_only=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "location",
            "location_code",
            "vehicle_plaque",
            "amount",
            "method",
            "payment_identifier",
            "status",
            "paid_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        method = attrs.get("method", getattr(self.instance, "method", None))
        payment_identifier = attrs.get(
            "payment_identifier",
            getattr(self.instance, "payment_identifier", ""),
        )

        if method != Payment.Method.CASH and not payment_identifier:
            raise serializers.ValidationError({
                "payment_identifier": "L'identifiant du paiement est obligatoire si le paiement n'est pas en cash."
            })

        return attrs
