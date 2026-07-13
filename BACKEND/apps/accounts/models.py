from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Post(models.Model):
    name = models.CharField(
        max_length=60,
        unique=True,
    )

    def __str__(self):
        return self.name


class UserProfile(models.Model):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"
        AGENT = "AGENT", "Agent"
        PHOTO = "PHOTO", "Photographe"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.AGENT,
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )

    def clean(self):
        super().clean()

        # Un administrateur ne doit pas avoir de poste
        if self.role == self.Role.ADMIN:
            if self.post is not None:
                raise ValidationError({
                    "post": "Un administrateur ne peut pas avoir de poste."
                })

        # Un agent doit obligatoirement avoir un poste
        if self.role == self.Role.AGENT:
            if self.post is None:
                raise ValidationError({
                    "post": "Un agent doit avoir un poste."
                })

        # Un photographe doit obligatoirement avoir un poste
        if self.role == self.Role.PHOTO:
            if self.post is None:
                raise ValidationError({
                    "post": "Un photographe doit avoir un poste."
                })

        # On continue seulement si un poste est sélectionné
        if self.post is not None:

            # Un seul agent par poste
            if self.role == self.Role.AGENT:
                agent_exists = UserProfile.objects.filter(
                    post=self.post,
                    role=self.Role.AGENT,
                ).exclude(
                    id=self.id
                ).exists()

                if agent_exists:
                    raise ValidationError({
                        "post": "Ce poste possède déjà un agent."
                    })

            # Vérifications pour le photographe
            if self.role == self.Role.PHOTO:

                # Un seul photographe par poste
                photo_exists = UserProfile.objects.filter(
                    post=self.post,
                    role=self.Role.PHOTO,
                ).exclude(
                    id=self.id
                ).exists()

                if photo_exists:
                    raise ValidationError({
                        "post": "Ce poste possède déjà un photographe."
                    })

                # Un agent doit déjà exister dans le poste
                agent_exists = UserProfile.objects.filter(
                    post=self.post,
                    role=self.Role.AGENT,
                ).exists()

                if not agent_exists:
                    raise ValidationError({
                        "post": "Ajoutez d'abord un agent dans ce poste."
                    })

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"