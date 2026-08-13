from django.conf import settings
from django.contrib.auth.models import Group
from django.db.models.signals import post_migrate
from django.db.models.signals import post_save
from django.dispatch import receiver

from .roles import ADMIN, AGENT, assurer_groupes_roles


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def assigner_groupe_role_par_defaut(sender, instance, created, **kwargs):
    if not created:
        return

    assurer_groupes_roles()
    role = ADMIN if instance.is_superuser else AGENT
    instance.groups.add(Group.objects.get(name=role))


@receiver(post_migrate)
def creer_groupes_roles(sender, **kwargs):
    if sender.name == "apps.accounts":
        assurer_groupes_roles()
