from django.db import models


class Parking(models.Model):

    name = models.CharField(
        max_length=50,
        unique=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name


class ParkingZone(models.Model):

    parking = models.ForeignKey(
        Parking,
        on_delete=models.CASCADE,
        related_name="zones",
    )

    vehicle_type = models.ForeignKey(
        "vehicles.VehicleType",
        on_delete=models.PROTECT,
        related_name="parking_zones",
    )

    name = models.CharField(
        max_length=50,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["parking", "name"],
                name="unique_zone_name_per_parking",
            )
        ]

    def __str__(self):
        return f"{self.parking.name} - {self.name}"