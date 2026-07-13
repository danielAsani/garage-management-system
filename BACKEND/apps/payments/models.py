from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Payment(models.Model):

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

    def clean(self):
        super().clean()

        if self.amount is not None and self.amount <= 0:
            raise ValidationError({
                "amount": "Le montant doit etre superieur a 0."
            })

    def save(self, *args, **kwargs):
        if self.status == self.Status.PAID and self.paid_at is None:
            self.paid_at = timezone.now()

        self.updated_at = timezone.now()
        self.full_clean()
        super().save(*args, **kwargs)
