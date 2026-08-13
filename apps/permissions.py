from rest_framework.permissions import BasePermission

from apps.accounts.roles import ADMIN, AGENT, recuperer_role_utilisateur


READ_ACTIONS = ["list", "retrieve"]
WRITE_ACTIONS = ["create", "update", "partial_update"]
DELETE_ACTIONS = ["destroy"]
CRUD_ACTIONS = READ_ACTIONS + WRITE_ACTIONS + DELETE_ACTIONS


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        role = recuperer_role_utilisateur(request.user)
        return role == ADMIN


class CanAccessVehicles(BasePermission):
    def has_permission(self, request, view):
        role = recuperer_role_utilisateur(request.user)

        if role == ADMIN:
            return True

        if role == AGENT and view.action in READ_ACTIONS + WRITE_ACTIONS:
            return True

        return False


class CanAccessVehicleTypes(BasePermission):
    def has_permission(self, request, view):
        role = recuperer_role_utilisateur(request.user)

        if role == ADMIN:
            return True

        if role == AGENT and view.action in READ_ACTIONS:
            return True

        return False


class CanAccessVehiclePhotos(BasePermission):
    def has_permission(self, request, view):
        role = recuperer_role_utilisateur(request.user)

        if role == ADMIN:
            return True

        if role == AGENT and view.action in CRUD_ACTIONS:
            return True

        return False


class CanAccessParkingConfig(BasePermission):
    def has_permission(self, request, view):
        role = recuperer_role_utilisateur(request.user)

        if role == ADMIN:
            return True

        if role == AGENT and view.action in READ_ACTIONS:
            return True

        return False


class CanManageOperations(BasePermission):
    def has_permission(self, request, view):
        role = recuperer_role_utilisateur(request.user)
        return role in [ADMIN, AGENT]
