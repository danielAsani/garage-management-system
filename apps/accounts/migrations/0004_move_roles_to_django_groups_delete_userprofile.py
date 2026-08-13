from django.conf import settings
from django.db import migrations


ADMIN = "ADMIN"
AGENT = "AGENT"
ROLE_NAMES = [ADMIN, AGENT]


def move_roles_to_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    UserProfile = apps.get_model("accounts", "UserProfile")
    user_app_label, user_model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(user_app_label, user_model_name)

    groups = {
        role: Group.objects.get_or_create(name=role)[0]
        for role in ROLE_NAMES
    }

    for user in User.objects.all():
        role = ADMIN if user.is_superuser else AGENT
        profile = UserProfile.objects.filter(user_id=user.pk).first()

        if profile and profile.role in ROLE_NAMES:
            role = profile.role

        user.groups.remove(*groups.values())
        user.groups.add(groups[role])


def restore_profiles_from_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    UserProfile = apps.get_model("accounts", "UserProfile")
    user_app_label, user_model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(user_app_label, user_model_name)

    admin_group = Group.objects.filter(name=ADMIN).first()

    for user in User.objects.all():
        role = AGENT

        if user.is_superuser:
            role = ADMIN
        elif admin_group and user.groups.filter(pk=admin_group.pk).exists():
            role = ADMIN

        UserProfile.objects.get_or_create(
            user_id=user.pk,
            defaults={"role": role},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_remove_userprofile_post_alter_userprofile_role_and_more"),
        ("auth", "0012_alter_user_first_name_max_length"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(move_roles_to_groups, restore_profiles_from_groups),
        migrations.DeleteModel(
            name="UserProfile",
        ),
    ]
