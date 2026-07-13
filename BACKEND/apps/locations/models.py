from django.core.exceptions import ValidationError
from django.db import models

from .utils import generate_code


class Location(models.Model):

    class Statut(models.TextChoices):
        PARKED = "PARKED", "Gare"
        EXITED = "EXITED", "Sorti"
        CANCELLED = "CANCELLED", "Annule"

    code = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.PROTECT,
        related_name="locations",
    )

    nom_deposeur = models.CharField(
        max_length=100,
    )

    telephone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
    )

    heure_entree = models.DateTimeField()

    heure_sortie = models.DateTimeField(
        blank=True,
        null=True,
    )

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.PARKED,
    )

    def __str__(self):
        return self.code

    def clean(self):
        super().clean()

        if self.statut == self.Statut.EXITED and self.heure_sortie is None:
            raise ValidationError({
                "heure_sortie": "L'heure de sortie est obligatoire si le vehicule est sorti."
            })

        if self.heure_sortie and self.heure_sortie < self.heure_entree:
            raise ValidationError({
                "heure_sortie": "L'heure de sortie doit etre apres l'heure d'entree."
            })

    def save(self, *args, **kwargs):
        if not self.code:
            code_genere = "LOC" + generate_code()

            while Location.objects.filter(code=code_genere).exclude(pk=self.pk).exists():
                code_genere = "LOC" + generate_code()

            self.code = code_genere

        self.full_clean()
        super().save(*args, **kwargs)
