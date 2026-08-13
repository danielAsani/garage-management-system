from django.contrib.auth.models import Group


ADMIN = "ADMIN"
AGENT = "AGENT"

ROLE_CHOICES = (
    (ADMIN, "Administrateur"),
    (AGENT, "Agent"),
)

ROLE_NAMES = [role for role, _label in ROLE_CHOICES]


def assurer_groupes_roles():
    for role, _label in ROLE_CHOICES:
        Group.objects.get_or_create(name=role)


def recuperer_role_utilisateur(user):
    if not user or not user.is_authenticated:
        return None

    if hasattr(user, "_parky_role"):
        return user._parky_role

    group_names = set(user.groups.values_list("name", flat=True))

    if ADMIN in group_names:
        user._parky_role = ADMIN
        return user._parky_role

    if AGENT in group_names:
        user._parky_role = AGENT
        return user._parky_role

    if user.is_superuser:
        user._parky_role = ADMIN
        return user._parky_role

    user._parky_role = None
    return user._parky_role


def recuperer_libelle_role(role):
    return dict(ROLE_CHOICES).get(role, "-")


def definir_role_utilisateur(user, role):
    if role not in ROLE_NAMES:
        role = AGENT

    assurer_groupes_roles()
    role_groups = Group.objects.filter(name__in=ROLE_NAMES)
    user.groups.remove(*role_groups)
    user.groups.add(Group.objects.get(name=role))
    if hasattr(user, "_parky_role"):
        delattr(user, "_parky_role")
