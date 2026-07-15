from decimal import Decimal, ROUND_HALF_UP
from math import ceil

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Payment(models.Model):
    MINIMUM_AMOUNT = Decimal("500.00")

    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        ORANGE_MONEY = "ORANGE_MONEY", "Orange Money"
        MPESA = "MPESA", "M-Pesa"
        AIRTEL_MONEY = "AIRTEL_MONEY", "Airtel Money"
        ILLICOCASH = "ILLICOCASH", "Illicocash"

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        PAID = "PAID", "Paye"
        FAILED = "FAILED", "Echoue"
        CANCELLED = "CANCELLED", "Annule"

    location = models.OneToOneField(
        "locations.Location",
        on_delete=models.PROTECT,
        related_name="payment",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ],
    )

    method = models.CharField(
        max_length=30,
        choices=Method.choices,
    )

    payment_identifier = models.CharField(
        max_length=100,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    paid_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False,
    )

    updated_at = models.DateTimeField(
        default=timezone.now,
    )

    def __str__(self):
        return f"{self.location.code} - {self.amount} - {self.get_status_display()}"

    def calculate_amount(self):
        location = self.location
        vehicle_type = location.vehicle.vehicle_type
        hourly_rate = vehicle_type.tarif_hours
        end_time = location.heure_sortie or timezone.now()
        duration_seconds = max(0, (end_time - location.heure_entree).total_seconds())
        billed_minutes = max(1, ceil(duration_seconds / 60))
        amount = hourly_rate * Decimal(billed_minutes) / Decimal("60")
        amount = max(amount, self.MINIMUM_AMOUNT)

        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def clean(self):
        super().clean()

        if self.amount is not None and self.amount <= 0:
            raise ValidationError({
                "amount": "Le montant doit etre superieur a 0."
            })

        if self.method != self.Method.CASH and not self.payment_identifier:
            raise ValidationError({
                "payment_identifier": "L'identifiant du paiement est obligatoire si le paiement n'est pas en cash."
            })

    def save(self, *args, **kwargs):
        if self.location_id:
            self.amount = self.calculate_amount()

        if self.status == self.Status.PAID and self.paid_at is None:
            self.paid_at = timezone.now()

        self.updated_at = timezone.now()
        self.full_clean()
        super().save(*args, **kwargs)
