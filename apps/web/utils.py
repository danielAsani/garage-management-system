from decimal import Decimal, ROUND_HALF_UP
from functools import wraps
from math import ceil

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.utils import timezone

from apps.accounts.roles import ADMIN, AGENT, recuperer_role_utilisateur


FC_PER_DOLLAR = Decimal("2300")


def recuperer_role(user):
    return recuperer_role_utilisateur(user)


def est_admin(user):
    return recuperer_role(user) == ADMIN


def est_agent(user):
    return recuperer_role(user) == AGENT


def administrateur_requis(view_func):
    @login_required
    @wraps(view_func)
    def enveloppe(request, *args, **kwargs):
        if not est_admin(request.user):
            messages.error(request, "Acces reserve aux administrateurs.")
            return redirect("web:dashboard")
        return view_func(request, *args, **kwargs)

    return enveloppe


def role_requis(*roles):
    def decorateur(view_func):
        @login_required
        @wraps(view_func)
        def enveloppe(request, *args, **kwargs):
            if recuperer_role(request.user) not in roles:
                messages.error(request, "Tu n'as pas les droits pour cette action.")
                return redirect("web:dashboard")
            return view_func(request, *args, **kwargs)

        return enveloppe

    return decorateur


def formater_fc(value):
    if value in (None, ""):
        return "-"

    amount = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    text = f"{amount:,.2f}".replace(",", " ").replace(".00", "")
    return f"{text} FC"


def formater_dollars(value):
    if value in (None, ""):
        return "-"

    amount = Decimal(str(value)) / FC_PER_DOLLAR
    text = f"{amount:,.2f}".replace(",", " ").replace(".", ",")
    return f"~= {text} $"


def minutes_facturees(location):
    end_time = location.heure_sortie or timezone.now()
    duration_seconds = max(0, (end_time - location.heure_entree).total_seconds())
    return max(1, ceil(duration_seconds / 60))


def calculer_montant_stationnement(location):
    hourly_rate = location.vehicle.vehicle_type.tarif_hours
    amount = hourly_rate * Decimal(minutes_facturees(location)) / Decimal("60")
    amount = max(amount, Decimal("500.00"))
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def ajouter_erreur_formulaire(request, exc, fallback):
    if hasattr(exc, "message_dict"):
        for field, errors in exc.message_dict.items():
            for error in errors:
                messages.error(request, f"{field}: {error}")
        return

    messages.error(request, str(exc) or fallback)
