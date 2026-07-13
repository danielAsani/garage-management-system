from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.core.exceptions import ValidationError

class VehicleType(models.Model):
    name = models.CharField(
        max_length=50,
        unique=True,
    )

    tarif_hours = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators= [
            MinValueValidator(Decimal("0.00"))
        ]
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Type de véhicule"
        verbose_name_plural = "Types de véhicules"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Vehicle(models.Model):
    plaque = models.CharField(
        max_length=20,
        unique=True,
    )

    vehicle_type = models.ForeignKey(
        VehicleType,
        on_delete=models.PROTECT,
        related_name="vehicles",
    )

    marque = models.CharField(
        max_length=100,
        blank=True,
    )

    couleur = models.CharField(
        max_length=30,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"
        ordering = ["plaque"]


    def __str__(self):
        return self.plaque
    
    def clean(self):
        super().clean()

        if not self.plaque:
            raise ValidationError({
                "plaque": "La plaque de matriculation est obligatoire."
            })
        
    def save(self, *args, **kwargs):
        if self.plaque:
            self.plaque = self.plaque.upper().strip()
        self.full_clean()
        super().save(*args, **kwargs)



class VehiclePhoto(models.Model):
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="photos"
    )

    image = models.ImageField(
        upload_to="vehicles/"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Photo de {self.vehicle.plaque}"


