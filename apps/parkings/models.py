from django.db import models


class ParkingZone(models.Model):

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
                fields=["name"],
                name="unique_parking_zone_name",
            )
        ]

    def __str__(self):
        return self.name
