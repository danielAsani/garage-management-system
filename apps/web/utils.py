from decimal import Decimal, ROUND_HALF_UP
from math import ceil

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.utils import timezone

from apps.accounts.models import UserProfile


FC_PER_DOLLAR = Decimal("2300")


def get_role(user):
    profile = getattr(user, "profile", None)
    if profile:
        return profile.role
    return UserProfile.Role.ADMIN if getattr(user, "is_superuser", False) else None


def is_admin(user):
    return get_role(user) == UserProfile.Role.ADMIN


def is_agent(user):
    return get_role(user) == UserProfile.Role.AGENT


def admin_required(view_func):
    @login_required
    def wrapper(request, *args, **kwargs):
        if not is_admin(request.user):
            messages.error(request, "Acces reserve aux administrateurs.")
            return redirect("web:dashboard")
        return view_func(request, *args, **kwargs)

    return wrapper


def role_required(*roles):
    def decorator(view_func):
        @login_required
        def wrapper(request, *args, **kwargs):
            if get_role(request.user) not in roles:
                messages.error(request, "Tu n'as pas les droits pour cette action.")
                return redirect("web:dashboard")
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def money(value):
    if value in (None, ""):
        return "-"

    amount = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    text = f"{amount:,.2f}".replace(",", " ").replace(".00", "")
    return f"{text} FC"


def dollars(value):
    if value in (None, ""):
        return "-"

    amount = Decimal(str(value)) / FC_PER_DOLLAR
    text = f"{amount:,.2f}".replace(",", " ").replace(".", ",")
    return f"~= {text} $"


def billed_minutes(location):
    end_time = location.heure_sortie or timezone.now()
    duration_seconds = max(0, (end_time - location.heure_entree).total_seconds())
    return max(1, ceil(duration_seconds / 60))


def calculate_location_amount(location):
    hourly_rate = location.vehicle.vehicle_type.tarif_hours
    amount = hourly_rate * Decimal(billed_minutes(location)) / Decimal("60")
    amount = max(amount, Decimal("500.00"))
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def add_form_error(request, exc, fallback):
    if hasattr(exc, "message_dict"):
        for field, errors in exc.message_dict.items():
            for error in errors:
                messages.error(request, f"{field}: {error}")
        return

    messages.error(request, str(exc) or fallback)

