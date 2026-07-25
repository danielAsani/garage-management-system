from decimal import Decimal

from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from apps.accounts.models import UserProfile
from apps.locations.models import Location
from apps.parkings.models import Parking, ParkingZone
from apps.parkings.utils import generate_zone_suffix
from apps.payments.models import Payment
from apps.vehicles.models import Vehicle, VehiclePhoto, VehicleType

from .utils import (
    add_form_error,
    admin_required,
    billed_minutes,
    calculate_location_amount,
    get_role,
    is_admin,
    is_agent,
)

User = get_user_model()


NAV_LINKS = [
    {"url_name": "web:dashboard", "label": "Accueil", "icon": "fa-house", "group": "Core"},
    {"url_name": "web:vehicles", "label": "Vehicules", "icon": "fa-car", "group": "Operations"},
    {"url_name": "web:operations", "label": "Operations", "icon": "fa-right-left", "group": "Operations"},
    {"url_name": "web:parkings", "label": "Parkings", "icon": "fa-warehouse", "group": "Configuration"},
    {"url_name": "web:finance", "label": "Finance", "icon": "fa-chart-line", "group": "Configuration", "admin_only": True},
    {"url_name": "web:users", "label": "Utilisateurs", "icon": "fa-users", "group": "Configuration", "admin_only": True},
]


def base_context(request, active="dashboard"):
    return {
        "active_page": active,
        "nav_links": NAV_LINKS,
        "role": get_role(request.user),
        "is_admin": is_admin(request.user),
        "is_agent": is_agent(request.user),
    }


def redirect_locations(request):
    return redirect("web:operations")


def redirect_payments(request):
    return redirect("web:operations")


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect("web:dashboard")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            return redirect("web:dashboard")

        messages.error(request, "Nom d'utilisateur ou mot de passe incorrect.")

    return render(request, "web/login.html")


def logout_view(request):
    logout(request)
    return redirect("web:login")


@login_required
def dashboard(request):
    recent_locations = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
        "parking_zone__parking",
    ).order_by("-heure_entree")[:5]

    context = {
        **base_context(request, "dashboard"),
        "page_title": f"Bonjour {request.user.username}",
        "page_subtitle": "Vue globale de la gestion du garage" if is_admin(request.user) else "Vos operations principales du jour",
        "vehicle_count": Vehicle.objects.count(),
        "parked_count": Location.objects.filter(statut=Location.Statut.PARKED).count(),
        "paid_count": Payment.objects.filter(status=Payment.Status.PAID).count(),
        "pending_count": Payment.objects.filter(status=Payment.Status.PENDING).count(),
        "recent_locations": recent_locations,
        "selected_location": get_selected_location(request),
    }
    return render(request, "web/dashboard.html", context)


def get_selected_location(request):
    location_id = request.GET.get("location")
    if not location_id:
        return None

    return Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
        "parking_zone__parking",
    ).filter(id=location_id).first()


def handle_vehicle_post(request):
    action = request.POST.get("action")
    can_write = is_admin(request.user) or is_agent(request.user)

    try:
        if action == "save_vehicle" and can_write:
            vehicle_id = request.POST.get("vehicle_id")
            vehicle = Vehicle.objects.get(pk=vehicle_id) if vehicle_id else Vehicle()
            vehicle.plaque = request.POST.get("plaque", "")
            vehicle.vehicle_type_id = request.POST.get("vehicle_type")
            vehicle.marque = request.POST.get("marque", "")
            vehicle.couleur = request.POST.get("couleur", "")
            vehicle.save()

            for image in request.FILES.getlist("photos"):
                VehiclePhoto.objects.create(vehicle=vehicle, image=image)

            messages.success(request, "Vehicule modifie avec succes." if vehicle_id else "Vehicule enregistre avec succes.")
            return redirect("web:vehicles")

        if action == "delete_vehicle" and is_admin(request.user):
            Vehicle.objects.get(pk=request.POST.get("vehicle_id")).delete()
            messages.success(request, "Vehicule supprime.")
            return redirect("web:vehicles")

        if action == "delete_photo" and can_write:
            VehiclePhoto.objects.get(pk=request.POST.get("photo_id")).delete()
            messages.success(request, "Photo supprimee.")
            return redirect("web:vehicles")

        if action == "save_type" and is_admin(request.user):
            type_id = request.POST.get("type_id")
            vehicle_type = VehicleType.objects.get(pk=type_id) if type_id else VehicleType()
            vehicle_type.name = request.POST.get("name", "")
            vehicle_type.tarif_hours = Decimal(request.POST.get("tarif_hours") or "0")
            vehicle_type.save()
            messages.success(request, "Tarif modifie." if type_id else "Type de vehicule ajoute.")
            return redirect("web:vehicles")

        messages.error(request, "Action non autorisee.")
    except (Vehicle.DoesNotExist, VehicleType.DoesNotExist, VehiclePhoto.DoesNotExist):
        messages.error(request, "Element introuvable.")
    except ProtectedError:
        messages.error(request, "Suppression impossible: cet element est deja utilise.")
    except Exception as exc:
        add_form_error(request, exc, "Impossible d'enregistrer.")

    return None


@login_required
def vehicles(request):
    if request.method == "POST":
        response = handle_vehicle_post(request)
        if response:
            return response

    edit_vehicle = Vehicle.objects.filter(pk=request.GET.get("edit_vehicle")).first()
    edit_type = VehicleType.objects.filter(pk=request.GET.get("edit_type")).first()
    vehicle_list = Vehicle.objects.select_related("vehicle_type").prefetch_related("photos").all()

    context = {
        **base_context(request, "vehicles"),
        "page_title": "Vehicules",
        "page_subtitle": "Enregistrer les vehicules et joindre des photos si necessaire",
        "vehicles": vehicle_list,
        "types": VehicleType.objects.all(),
        "edit_vehicle": edit_vehicle,
        "edit_type": edit_type,
        "can_write_vehicle": is_admin(request.user) or is_agent(request.user),
        "can_delete_vehicle": is_admin(request.user),
    }
    return render(request, "web/vehicles.html", context)


def same_plate(left, right):
    return (left or "").strip().upper() == (right or "").strip().upper()


def create_generated_zones(parking, vehicle_type, quantity):
    created = 0
    index = 0
    max_zone_count = 26 * 26 * 26

    with transaction.atomic():
        while created < quantity:
            if index >= max_zone_count:
                raise ValueError("Impossible de generer autant de zones pour ce type.")

            name = f"{vehicle_type.name}-{generate_zone_suffix(index)}"
            index += 1

            if ParkingZone.objects.filter(parking=parking, name=name).exists():
                continue

            ParkingZone.objects.create(parking=parking, vehicle_type=vehicle_type, name=name)
            created += 1


def handle_operations_post(request):
    action = request.POST.get("action")

    try:
        if action == "entry":
            plaque = request.POST.get("plaque", "").strip().upper()
            vehicle = Vehicle.objects.filter(plaque=plaque).first()

            if not vehicle:
                vehicle = Vehicle.objects.create(
                    plaque=plaque,
                    vehicle_type_id=request.POST.get("vehicle_type"),
                    marque=request.POST.get("marque", ""),
                    couleur=request.POST.get("couleur", ""),
                )

            for image in request.FILES.getlist("photos"):
                VehiclePhoto.objects.create(vehicle=vehicle, image=image)

            Location.objects.create(
                vehicle=vehicle,
                parking_zone_id=request.POST.get("parking_zone"),
                nom_deposeur=request.POST.get("nom_deposeur", ""),
                telephone=request.POST.get("telephone") or None,
                heure_entree=timezone.now(),
                statut=Location.Statut.PARKED,
            )
            messages.success(request, "Vehicule gare avec succes.")
            return redirect("web:operations")

        if action == "finalize_exit":
            location = get_object_or_404(Location, pk=request.POST.get("location_id"), statut=Location.Statut.PARKED)
            location.heure_sortie = timezone.now()
            location.statut = Location.Statut.EXITED
            location.save()

            payment, _ = Payment.objects.get_or_create(
                location=location,
                defaults={
                    "method": request.POST.get("method", Payment.Method.CASH),
                    "payment_identifier": request.POST.get("payment_identifier", ""),
                    "status": Payment.Status.PAID,
                },
            )
            payment.method = request.POST.get("method", Payment.Method.CASH)
            payment.payment_identifier = request.POST.get("payment_identifier", "")
            payment.status = Payment.Status.PAID
            payment.save()

            messages.success(request, "Paiement valide et sortie finalisee.")
            return redirect(f"{request.path}?receipt={payment.id}")

    except Exception as exc:
        add_form_error(request, exc, "Impossible de traiter l'operation.")

    return None


@login_required
def operations(request):
    response = None
    if request.method == "POST" and request.POST.get("action") != "search_exit":
        response = handle_operations_post(request)
        if response:
            return response

    exit_search = request.POST.get("search") if request.method == "POST" else request.GET.get("exit_search", "")
    exit_target = None
    if request.method == "POST" and request.POST.get("action") == "search_exit":
        query = (exit_search or "").strip().upper()
        exit_target = Location.objects.select_related(
            "vehicle",
            "vehicle__vehicle_type",
            "parking_zone",
            "parking_zone__parking",
        ).filter(statut=Location.Statut.PARKED).filter(code__iexact=query).first()
        if not exit_target:
            exit_target = Location.objects.select_related(
                "vehicle",
                "vehicle__vehicle_type",
                "parking_zone",
                "parking_zone__parking",
            ).filter(statut=Location.Statut.PARKED, vehicle__plaque__iexact=query).first()
        if not exit_target:
            messages.error(request, "Aucun vehicule actuellement gare avec ce code ou cette plaque.")

    parked_locations = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
        "parking_zone__parking",
    ).filter(statut=Location.Statut.PARKED).order_by("-heure_entree")
    exited_locations = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
        "parking_zone__parking",
    ).filter(statut=Location.Statut.EXITED).order_by("-heure_sortie")[:10]
    occupied_zone_ids = set(parked_locations.values_list("parking_zone_id", flat=True))
    zones = list(ParkingZone.objects.select_related("parking", "vehicle_type").order_by("parking__name", "name"))

    for zone in zones:
        zone.is_occupied = zone.id in occupied_zone_ids

    receipt_payment = Payment.objects.select_related("location", "location__vehicle").filter(pk=request.GET.get("receipt")).first()

    context = {
        **base_context(request, "operations"),
        "page_title": "Operations",
        "page_subtitle": "Gerer les entrees, sorties, emplacements et paiements",
        "active_tab": "exit" if request.method == "POST" and request.POST.get("action") == "search_exit" else "entry",
        "vehicles": Vehicle.objects.select_related("vehicle_type").all(),
        "types": VehicleType.objects.all(),
        "parkings": Parking.objects.all().order_by("name"),
        "zones": zones,
        "parked_locations": parked_locations,
        "exited_locations": exited_locations,
        "payments_by_location": {payment.location_id: payment for payment in Payment.objects.select_related("location")},
        "exit_search": exit_search,
        "exit_target": exit_target,
        "exit_amount": calculate_location_amount(exit_target) if exit_target else None,
        "exit_minutes": billed_minutes(exit_target) if exit_target else None,
        "receipt_payment": receipt_payment,
        "selected_location": get_selected_location(request),
    }
    return render(request, "web/operations.html", context)


def handle_parking_post(request):
    action = request.POST.get("action")

    if not is_admin(request.user):
        messages.error(request, "Action reservee aux administrateurs.")
        return None

    try:
        if action == "create_parking":
            Parking.objects.create(name=request.POST.get("name", ""))
            messages.success(request, "Parking cree.")
        elif action == "create_zones":
            parking = get_object_or_404(Parking, pk=request.POST.get("parking"))
            vehicle_type = get_object_or_404(VehicleType, pk=request.POST.get("vehicle_type"))
            create_generated_zones(parking, vehicle_type, int(request.POST.get("quantity") or 0))
            messages.success(request, "Zones creees automatiquement.")
        elif action == "delete_parking":
            Parking.objects.get(pk=request.POST.get("parking_id")).delete()
            messages.success(request, "Parking supprime.")
        elif action == "delete_zone":
            ParkingZone.objects.get(pk=request.POST.get("zone_id")).delete()
            messages.success(request, "Zone supprimee.")
    except (Parking.DoesNotExist, ParkingZone.DoesNotExist):
        messages.error(request, "Element introuvable.")
    except (IntegrityError, ProtectedError):
        messages.error(request, "Suppression impossible: cet element est deja utilise.")
    except Exception as exc:
        add_form_error(request, exc, "Impossible de traiter le parking.")


@login_required
def parkings(request):
    if request.method == "POST":
        handle_parking_post(request)
        return redirect("web:parkings")

    selected_type = request.GET.get("type", "all")
    parkings_qs = list(Parking.objects.all().order_by("name"))
    zones = list(ParkingZone.objects.select_related("parking", "vehicle_type").order_by("parking__name", "name"))
    occupied = {
        location.parking_zone_id: location
        for location in Location.objects.select_related("vehicle").filter(statut=Location.Statut.PARKED, parking_zone__isnull=False)
    }

    if selected_type != "all":
        zones = [zone for zone in zones if str(zone.vehicle_type_id) == str(selected_type)]

    zones_by_parking = {}
    for zone in zones:
        zone.occupied_location = occupied.get(zone.id)
        zones_by_parking.setdefault(zone.parking_id, []).append(zone)

    visible_parkings = []
    for parking in parkings_qs:
        parking.web_zones = zones_by_parking.get(parking.id, [])
        if selected_type == "all" or parking.web_zones:
            occupied_count = sum(1 for zone in parking.web_zones if zone.occupied_location)
            parking.total_zones = len(parking.web_zones)
            parking.occupied_zones = occupied_count
            parking.available_zones = parking.total_zones - occupied_count
            summary = {}
            for zone in parking.web_zones:
                summary[zone.vehicle_type.name] = summary.get(zone.vehicle_type.name, 0) + 1
            parking.type_summary = summary.items()
            visible_parkings.append(parking)

    context = {
        **base_context(request, "parkings"),
        "page_title": "Parkings",
        "page_subtitle": "Configurer les parkings et generer les zones" if is_admin(request.user) else "Consulter les parkings disponibles",
        "parkings": visible_parkings,
        "all_parkings": parkings_qs,
        "types": VehicleType.objects.all(),
        "selected_type": selected_type,
    }
    return render(request, "web/parkings.html", context)


@admin_required
def finance(request):
    paid_payments = Payment.objects.filter(status=Payment.Status.PAID)
    by_method = paid_payments.values("method").annotate(amount=Sum("amount")).order_by("method")

    context = {
        **base_context(request, "finance"),
        "page_title": "Finance",
        "page_subtitle": "Suivre les encaissements et le rendement du parking",
        "total_paid": paid_payments.aggregate(total=Sum("amount"))["total"] or 0,
        "paid_count": paid_payments.count(),
        "exited_count": Location.objects.filter(statut=Location.Statut.EXITED).count(),
        "by_method": by_method,
        "recent_payments": Payment.objects.select_related("location", "location__vehicle").order_by("-created_at")[:100],
    }
    return render(request, "web/finance.html", context)


def handle_users_post(request):
    action = request.POST.get("action")

    try:
        if action == "save_user":
            user_id = request.POST.get("user_id")
            user = User.objects.get(pk=user_id) if user_id else User()
            user.username = request.POST.get("username", "").strip()
            user.email = request.POST.get("email", "").strip()
            user.first_name = request.POST.get("first_name", "").strip()
            user.last_name = request.POST.get("last_name", "").strip()
            user.is_active = request.POST.get("is_active") == "on"

            password = request.POST.get("password", "")
            if password:
                user.set_password(password)
            elif not user_id:
                messages.error(request, "Le mot de passe est obligatoire pour creer un utilisateur.")
                return

            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = request.POST.get("role", UserProfile.Role.AGENT)
            profile.save()
            messages.success(request, "Utilisateur modifie." if user_id else "Utilisateur cree.")

        elif action == "toggle_user":
            user = User.objects.get(pk=request.POST.get("user_id"))
            user.is_active = not user.is_active
            user.save(update_fields=["is_active"])
            messages.success(request, "Utilisateur active." if user.is_active else "Utilisateur desactive.")
    except User.DoesNotExist:
        messages.error(request, "Utilisateur introuvable.")
    except Exception as exc:
        add_form_error(request, exc, "Impossible d'enregistrer l'utilisateur.")


@admin_required
def users(request):
    if request.method == "POST":
        handle_users_post(request)
        return redirect("web:users")

    context = {
        **base_context(request, "users"),
        "page_title": "Utilisateurs",
        "page_subtitle": "Creer les comptes et modifier les roles des agents",
        "users": User.objects.select_related("profile").order_by("username"),
        "edit_user": User.objects.select_related("profile").filter(pk=request.GET.get("edit")).first(),
        "roles": UserProfile.Role.choices,
    }
    return render(request, "web/users.html", context)


@login_required
def receipt(request, payment_id):
    payment = get_object_or_404(
        Payment.objects.select_related(
            "location",
            "location__vehicle",
            "location__vehicle__vehicle_type",
            "location__parking_zone",
            "location__parking_zone__parking",
        ),
        pk=payment_id,
    )
    return render(request, "web/receipt.html", {"payment": payment})


def error_403(request, exception=None):
    return render(request, "403.html", status=403)


def error_404(request, exception=None):
    return render(request, "404.html", status=404)


def error_500(request):
    return render(request, "500.html", status=500)
