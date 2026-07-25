from django.conf import settings
from django.db import models




class UserProfile(models.Model):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"
        AGENT = "AGENT", "Agent"

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


    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"