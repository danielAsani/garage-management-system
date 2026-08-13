from decimal import Decimal
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.db.models import Count, OuterRef, Q, Subquery, Sum
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from apps.accounts.roles import AGENT, ROLE_CHOICES, definir_role_utilisateur, recuperer_libelle_role
from apps.locations.models import Location
from apps.parkings.models import ParkingZone
from apps.parkings.utils import generer_suffixe_place
from apps.payments.models import Payment
from apps.vehicles.models import Vehicle, VehiclePhoto, VehicleType

from .utils import (
    administrateur_requis,
    ajouter_erreur_formulaire,
    calculer_montant_stationnement,
    est_admin,
    est_agent,
    minutes_facturees,
    recuperer_role,
)

User = get_user_model()


NAV_LINKS = [
    {"url_name": "web:dashboard", "label": "Dashboard", "icon_name": "dashboard", "group": "Core"},
    {"url_name": "web:entry", "label": "Entree", "icon_name": "log-in", "group": "Stationnement", "agent_only": True},
    {"url_name": "web:exit", "label": "Sortie", "icon_name": "log-out", "group": "Stationnement", "agent_only": True},
    {"url_name": "web:history", "label": "Historique", "icon_name": "activity", "group": "Stationnement"},
    {"url_name": "web:vehicles", "label": "Vehicules", "icon_name": "car", "group": "Stationnement"},
    {"url_name": "web:parkings", "label": "Places", "icon_name": "parking", "group": "Configuration"},
    {"url_name": "web:finance", "label": "Paiements", "icon_name": "credit-card", "group": "Configuration", "admin_only": True},
    {"url_name": "web:users", "label": "Equipe", "icon_name": "users", "group": "Configuration", "admin_only": True},
]

ZONE_RENDER_LIMIT = 40
VEHICLE_SUGGESTION_LIMIT = 80
VEHICLE_CARD_LIMIT = 80
LOCATION_TABLE_LIMIT = 50
PAYMENT_RENDER_LIMIT = 50
MAX_VEHICLE_PHOTOS = 4


def recuperer_photos_vehicule(request):
    uploads = list(request.FILES.getlist("photos"))
    if len(uploads) > MAX_VEHICLE_PHOTOS:
        raise ValueError(f"Un vehicule ne peut pas avoir plus de {MAX_VEHICLE_PHOTOS} photos.")
    return uploads


def planifier_suppression_fichiers_photos(photos):
    files = [photo.image for photo in photos if photo.image]

    def supprimer_fichiers():
        for image in files:
            try:
                image.delete(save=False)
            except Exception:
                pass

    transaction.on_commit(supprimer_fichiers)


def remplacer_photos_vehicule(vehicle, uploads):
    if len(uploads) > MAX_VEHICLE_PHOTOS:
        raise ValueError(f"Un vehicule ne peut pas avoir plus de {MAX_VEHICLE_PHOTOS} photos.")

    if not uploads:
        return

    old_photos = list(vehicle.photos.all())
    old_photo_ids = [photo.id for photo in old_photos]
    created_photos = []

    try:
        for image in uploads:
            created_photos.append(VehiclePhoto.objects.create(vehicle=vehicle, image=image))

        if old_photo_ids:
            VehiclePhoto.objects.filter(id__in=old_photo_ids).delete()
            planifier_suppression_fichiers_photos(old_photos)
    except Exception:
        for photo in created_photos:
            try:
                photo.image.delete(save=False)
            except Exception:
                pass
        raise


def contexte_base(request, active="dashboard"):
    user_is_admin = est_admin(request.user)
    user_is_agent = est_agent(request.user)
    visible_links = [
        link
        for link in NAV_LINKS
        if not (link.get("admin_only") and not user_is_admin)
        and not (link.get("agent_only") and not user_is_agent)
    ]

    return {
        "active_page": active,
        "nav_links": visible_links,
        "role": recuperer_role(request.user),
        "is_admin": user_is_admin,
        "is_agent": user_is_agent,
    }


@require_http_methods(["GET", "POST"])
def connexion(request):
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


def deconnexion(request):
    logout(request)
    return redirect("web:login")


@login_required
def profil(request):
    context = {
        **contexte_base(request, "profile"),
        "page_title": "Modifier mon compte",
        "page_subtitle": "Mettre a jour les informations du compte connecte",
    }
    return render(request, "web/profile.html", context)


@login_required
@require_http_methods(["POST"])
def modifier_profil(request):
    user = request.user
    try:
        username = request.POST.get("username", "").strip()

        if not username:
            messages.error(request, "Le nom d'utilisateur est obligatoire.")
            return redirect("web:profile")

        if User.objects.exclude(pk=user.pk).filter(username__iexact=username).exists():
            messages.error(request, "Ce nom d'utilisateur est deja utilise.")
            return redirect("web:profile")

        user.username = username
        user.email = request.POST.get("email", "").strip()
        user.first_name = request.POST.get("first_name", "").strip()
        user.last_name = request.POST.get("last_name", "").strip()

        current_password = request.POST.get("current_password", "")
        new_password = request.POST.get("new_password", "")
        confirm_password = request.POST.get("confirm_password", "")

        if new_password or confirm_password:
            if not current_password:
                messages.error(request, "Saisis le mot de passe actuel pour changer le mot de passe.")
                return redirect("web:profile")

            if not user.check_password(current_password):
                messages.error(request, "Le mot de passe actuel est incorrect.")
                return redirect("web:profile")

            if new_password != confirm_password:
                messages.error(request, "Le nouveau mot de passe et la confirmation ne correspondent pas.")
                return redirect("web:profile")

            user.set_password(new_password)

        user.save()

        if new_password:
            update_session_auth_hash(request, user)

        messages.success(request, "Compte mis a jour.")
    except Exception as exc:
        ajouter_erreur_formulaire(request, exc, "Impossible de modifier le compte.")

    return redirect("web:profile")


@login_required
def tableau_de_bord(request):
    today = timezone.localdate()
    parked_locations = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
    ).filter(statut=Location.Statut.PARKED).order_by("-heure_entree")[:8]
    recent_locations = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
    ).order_by("-heure_entree")[:5]
    total_zones = ParkingZone.objects.count()
    location_counts = Location.objects.aggregate(
        parked_count=Count("id", filter=Q(statut=Location.Statut.PARKED)),
        entries_today_count=Count("id", filter=Q(heure_entree__date=today)),
        exits_today_count=Count("id", filter=Q(heure_sortie__date=today)),
    )
    payment_counts = Payment.objects.aggregate(
        pending_count=Count("id", filter=Q(status=Payment.Status.PENDING)),
    )
    parked_count = location_counts["parked_count"]

    context = {
        **contexte_base(request, "dashboard"),
        "page_title": f"Bonjour {request.user.username}",
        "page_subtitle": "Parking aujourd'hui: presences, capacite, sorties et paiements en un seul coup d'oeil",
        "parked_count": parked_count,
        "available_zone_count": max(0, total_zones - parked_count),
        "entries_today_count": location_counts["entries_today_count"],
        "exits_today_count": location_counts["exits_today_count"],
        "pending_count": payment_counts["pending_count"],
        "parked_locations": parked_locations,
        "recent_locations": recent_locations,
        "selected_location": recuperer_stationnement_selectionne(request),
    }
    return render(request, "web/dashboard.html", context)


def recuperer_stationnement_selectionne(request):
    location_id = request.GET.get("location")
    if not location_id:
        return None

    return Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
    ).filter(id=location_id).first()


def traiter_formulaire_vehicule(request):
    action = request.POST.get("action")
    can_write = est_admin(request.user) or est_agent(request.user)

    try:
        if action == "save_vehicle" and can_write:
            photo_uploads = recuperer_photos_vehicule(request)
            vehicle_id = request.POST.get("vehicle_id")
            vehicle = Vehicle.objects.get(pk=vehicle_id) if vehicle_id else Vehicle()
            vehicle.plaque = request.POST.get("plaque", "")
            vehicle.vehicle_type_id = request.POST.get("vehicle_type")
            vehicle.marque = request.POST.get("marque", "")
            vehicle.couleur = request.POST.get("couleur", "")
            with transaction.atomic():
                vehicle.save()
                remplacer_photos_vehicule(vehicle, photo_uploads)

            messages.success(request, "Vehicule modifie avec succes." if vehicle_id else "Vehicule enregistre avec succes.")
            return redirect("web:vehicles")

        if action == "delete_vehicle" and est_admin(request.user):
            vehicle = Vehicle.objects.prefetch_related("photos").get(pk=request.POST.get("vehicle_id"))
            photos = list(vehicle.photos.all())
            vehicle.delete()
            planifier_suppression_fichiers_photos(photos)
            messages.success(request, "Vehicule supprime.")
            return redirect("web:vehicles")

        if action == "delete_photo" and can_write:
            photo = VehiclePhoto.objects.get(pk=request.POST.get("photo_id"))
            photo.delete()
            planifier_suppression_fichiers_photos([photo])
            messages.success(request, "Photo supprimee.")
            return redirect("web:vehicles")

        if action == "save_type" and est_admin(request.user):
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
        ajouter_erreur_formulaire(request, exc, "Impossible d'enregistrer.")

    return None


@login_required
def vehicules(request):
    if request.method == "POST":
        response = traiter_formulaire_vehicule(request)
        if response:
            return response

    edit_vehicle = Vehicle.objects.filter(pk=request.GET.get("edit_vehicle")).first()
    edit_type = VehicleType.objects.filter(pk=request.GET.get("edit_type")).first()
    vehicle_qs = Vehicle.objects.select_related("vehicle_type").prefetch_related("photos").all()
    vehicle_list = list(vehicle_qs[:VEHICLE_CARD_LIMIT])

    context = {
        **contexte_base(request, "vehicles"),
        "page_title": "Vehicules",
        "page_subtitle": "Enregistrer les vehicules et joindre des photos si necessaire",
        "vehicles": vehicle_list,
        "hidden_vehicle_count": max(0, vehicle_qs.count() - len(vehicle_list)),
        "types": VehicleType.objects.all(),
        "edit_vehicle": edit_vehicle,
        "edit_type": edit_type,
        "can_write_vehicle": est_admin(request.user) or est_agent(request.user),
        "can_delete_vehicle": est_admin(request.user),
    }
    return render(request, "web/vehicles.html", context)


def meme_plaque(left, right):
    return (left or "").strip().upper() == (right or "").strip().upper()


def creer_places_generees(vehicle_type, quantity):
    created = 0
    index = 0
    max_zone_count = 26 * 26 * 26

    with transaction.atomic():
        while created < quantity:
            if index >= max_zone_count:
                raise ValueError("Impossible de generer autant de zones pour ce type.")

            name = f"{vehicle_type.name}-{generer_suffixe_place(index)}"
            index += 1

            if ParkingZone.objects.filter(name=name).exists():
                continue

            ParkingZone.objects.create(vehicle_type=vehicle_type, name=name)
            created += 1


def trouver_place_disponible(vehicle_type):
    occupied_zone_ids = Location.objects.filter(
        statut=Location.Statut.PARKED,
        parking_zone__isnull=False,
    ).values_list("parking_zone_id", flat=True)

    return (
        ParkingZone.objects.filter(
            vehicle_type=vehicle_type,
        )
        .exclude(id__in=occupied_zone_ids)
        .order_by("name")
        .first()
    )


def recuperer_capacite_par_type_vehicule():
    occupied_by_type = dict(
        Location.objects.filter(
            statut=Location.Statut.PARKED,
            parking_zone__isnull=False,
        )
        .values("parking_zone__vehicle_type_id")
        .annotate(total=Count("id"))
        .values_list("parking_zone__vehicle_type_id", "total")
    )
    vehicle_types = VehicleType.objects.annotate(total_zones=Count("parking_zones")).order_by("name")

    capacity = []
    for vehicle_type in vehicle_types:
        occupied = occupied_by_type.get(vehicle_type.id, 0)
        total = vehicle_type.total_zones
        capacity.append(
            {
                "type": vehicle_type,
                "total": total,
                "occupied": occupied,
                "available": max(0, total - occupied),
            }
        )

    return capacity


def traiter_entree(request):
    action = request.POST.get("action")

    try:
        if action == "entry":
            if not est_agent(request.user):
                messages.error(request, "Seuls les agents peuvent garer un vehicule.")
                return redirect("web:dashboard")

            photo_uploads = recuperer_photos_vehicule(request)
            plaque = request.POST.get("plaque", "").strip().upper()
            if not plaque:
                messages.error(request, "La plaque est obligatoire.")
                return redirect("web:entry")

            vehicle = Vehicle.objects.filter(plaque__iexact=plaque).first()

            if vehicle and Location.objects.filter(vehicle=vehicle, statut=Location.Statut.PARKED).exists():
                messages.error(request, "Ce vehicule est deja gare.")
                return redirect("web:entry")

            vehicle_type = vehicle.vehicle_type if vehicle else None
            if not vehicle:
                vehicle_type_id = request.POST.get("vehicle_type")
                if not vehicle_type_id:
                    messages.error(request, "Choisis le type du vehicule pour trouver une place libre.")
                    return redirect("web:entry")

                vehicle_type = VehicleType.objects.filter(pk=vehicle_type_id).first()
                if not vehicle_type:
                    messages.error(request, "Type de vehicule introuvable.")
                    return redirect("web:entry")

            parking_zone = trouver_place_disponible(vehicle_type)
            if not parking_zone:
                messages.error(request, f"Aucune place libre pour le type {vehicle_type.name}.")
                return redirect("web:entry")

            with transaction.atomic():
                if not vehicle:
                    vehicle = Vehicle.objects.create(
                        plaque=plaque,
                        vehicle_type=vehicle_type,
                        marque=request.POST.get("marque", ""),
                        couleur=request.POST.get("couleur", ""),
                    )

                location = Location.objects.create(
                    vehicle=vehicle,
                    parking_zone=parking_zone,
                    nom_deposeur=request.POST.get("nom_deposeur", ""),
                    telephone=request.POST.get("telephone") or None,
                    heure_entree=timezone.now(),
                    statut=Location.Statut.PARKED,
                )

                remplacer_photos_vehicule(vehicle, photo_uploads)

            messages.success(request, f"Vehicule gare avec succes. Place attribuee: {parking_zone.name}.")
            return redirect("web:parking_token", location.id)

    except Exception as exc:
        ajouter_erreur_formulaire(request, exc, "Impossible d'enregistrer l'entree.")

    return None


def trouver_stationnement_sortie(query):
    query = (query or "").strip().upper()
    if not query:
        return None

    base_qs = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
    ).filter(statut=Location.Statut.PARKED)

    location = base_qs.filter(code__iexact=query).first()
    if location:
        return location

    return base_qs.filter(vehicle__plaque__iexact=query).first()


def traiter_paiement(request, location):
    action = request.POST.get("action")

    try:
        if action == "finalize_payment":
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
        ajouter_erreur_formulaire(request, exc, "Impossible de finaliser le paiement.")

    return None


@login_required
def entree(request):
    if not est_agent(request.user):
        messages.error(request, "L'entree vehicule est reservee aux agents.")
        return redirect("web:dashboard")

    if request.method == "POST":
        response = traiter_entree(request)
        if response:
            return response

    capacity_by_type = recuperer_capacite_par_type_vehicule()
    latest_location = Location.objects.filter(vehicle_id=OuterRef("pk")).order_by("-heure_entree")
    vehicle_suggestions = list(
        Vehicle.objects.select_related("vehicle_type")
        .prefetch_related("photos")
        .annotate(
            latest_depositor_name=Subquery(latest_location.values("nom_deposeur")[:1]),
            latest_depositor_phone=Subquery(latest_location.values("telephone")[:1]),
        )
        .order_by("plaque")[:VEHICLE_SUGGESTION_LIMIT]
    )

    known_vehicle_payload = []
    for vehicle in vehicle_suggestions:
        photos = list(vehicle.photos.all())
        known_vehicle_payload.append(
            {
                "plaque": vehicle.plaque,
                "type": vehicle.vehicle_type.name if vehicle.vehicle_type_id else "",
                "marque": vehicle.marque or "",
                "couleur": vehicle.couleur or "",
                "photo": photos[0].image.url if photos else "",
                "depositor_name": vehicle.latest_depositor_name or "",
                "depositor_phone": vehicle.latest_depositor_phone or "",
            }
        )

    context = {
        **contexte_base(request, "entry"),
        "page_title": "Nouvelle entree",
        "page_subtitle": "Garer un vehicule rapidement avec attribution automatique de la place",
        "vehicles": vehicle_suggestions,
        "known_vehicle_json": known_vehicle_payload,
        "types": [item["type"] for item in capacity_by_type],
        "capacity_by_type": capacity_by_type,
    }
    return render(request, "web/entry.html", context)


@login_required
def jeton_stationnement(request, location_id):
    location = get_object_or_404(
        Location.objects.select_related(
            "vehicle",
            "vehicle__vehicle_type",
            "parking_zone",
        ),
        pk=location_id,
    )
    return render(request, "web/parking_token.html", {"location": location})


@login_required
def sortie(request):
    search_performed = False
    exit_search = ""
    exit_target = None

    if request.method == "POST" and request.POST.get("action") == "search_exit":
        exit_search = request.POST.get("search", "")
        search_performed = True
    elif request.GET.get("target"):
        exit_search = request.GET.get("target", "")
        search_performed = True
    elif request.GET.get("exit_search"):
        exit_search = request.GET.get("exit_search", "")
        search_performed = True

    if search_performed:
        exit_target = trouver_stationnement_sortie(exit_search)

    receipt_payment = Payment.objects.select_related("location", "location__vehicle").filter(pk=request.GET.get("receipt")).first()
    pending_count = Payment.objects.filter(status=Payment.Status.PENDING).count()

    context = {
        **contexte_base(request, "exit"),
        "page_title": "Sortie vehicule",
        "page_subtitle": "Retrouver un vehicule, encaisser et liberer la place",
        "pending_count": pending_count,
        "exit_search": exit_search,
        "search_performed": search_performed,
        "exit_target": exit_target,
        "exit_amount": calculer_montant_stationnement(exit_target) if exit_target else None,
        "exit_minutes": minutes_facturees(exit_target) if exit_target else None,
        "receipt_payment": receipt_payment,
    }
    return render(request, "web/exit.html", context)


@login_required
def historique(request):
    parked_qs = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
    ).filter(statut=Location.Statut.PARKED).order_by("-heure_entree")
    parked_locations = list(parked_qs[:LOCATION_TABLE_LIMIT])
    recent_entries = list(
        Location.objects.select_related(
            "vehicle",
            "vehicle__vehicle_type",
            "parking_zone",
        ).order_by("-heure_entree")[:LOCATION_TABLE_LIMIT]
    )
    exited_locations = list(
        Location.objects.select_related(
            "vehicle",
            "vehicle__vehicle_type",
            "parking_zone",
        ).filter(statut=Location.Statut.EXITED).order_by("-heure_sortie")[:LOCATION_TABLE_LIMIT]
    )
    payment_locations = [location.id for location in exited_locations]

    context = {
        **contexte_base(request, "history"),
        "page_title": "Historique",
        "page_subtitle": "Listes de suivi separees des operations Entree et Sortie",
        "parked_locations": parked_locations,
        "hidden_parked_count": max(0, parked_qs.count() - len(parked_locations)),
        "recent_entries": recent_entries,
        "exited_locations": exited_locations,
        "payments_by_location": {
            payment.location_id: payment
            for payment in Payment.objects.filter(location_id__in=payment_locations)
        },
        "selected_location": recuperer_stationnement_selectionne(request),
    }
    return render(request, "web/history.html", context)


@login_required
def paiement(request, location_id):
    receipt_payment = None

    if request.GET.get("receipt"):
        receipt_payment = get_object_or_404(
            Payment.objects.select_related(
                "location",
                "location__vehicle",
                "location__vehicle__vehicle_type",
                "location__parking_zone",
            ),
            pk=request.GET.get("receipt"),
            location_id=location_id,
        )
        location = receipt_payment.location
    else:
        location = get_object_or_404(
            Location.objects.select_related("vehicle", "vehicle__vehicle_type", "parking_zone"),
            pk=location_id,
            statut=Location.Statut.PARKED,
        )

    if request.method == "POST":
        response = traiter_paiement(request, location)
        if response:
            return response

    context = {
        **contexte_base(request, "exit"),
        "page_title": "Paiement finalise" if receipt_payment else "Paiement",
        "page_subtitle": "La place est liberee et le recu est pret" if receipt_payment else "Encaisser le stationnement et liberer la place",
        "location": location,
        "amount": receipt_payment.amount if receipt_payment else calculer_montant_stationnement(location),
        "minutes": minutes_facturees(location),
        "payment_methods": Payment.Method.choices,
        "receipt_payment": receipt_payment,
    }
    return render(request, "web/payment.html", context)


def traiter_formulaire_places(request):
    action = request.POST.get("action")

    if not est_admin(request.user):
        messages.error(request, "Action reservee aux administrateurs.")
        return None

    try:
        if action == "create_zones":
            vehicle_type = get_object_or_404(VehicleType, pk=request.POST.get("vehicle_type"))
            creer_places_generees(vehicle_type, int(request.POST.get("quantity") or 0))
            messages.success(request, "Zones creees automatiquement.")
        elif action == "delete_zone":
            ParkingZone.objects.get(pk=request.POST.get("zone_id")).delete()
            messages.success(request, "Zone supprimee.")
    except ParkingZone.DoesNotExist:
        messages.error(request, "Element introuvable.")
    except (IntegrityError, ProtectedError):
        messages.error(request, "Suppression impossible: cet element est deja utilise.")
    except Exception as exc:
        ajouter_erreur_formulaire(request, exc, "Impossible de traiter les places.")


@login_required
def places(request):
    if request.method == "POST":
        traiter_formulaire_places(request)
        return redirect("web:parkings")

    selected_type = request.GET.get("type", "all")
    show_all_zones = request.GET.get("show") == "all"
    zones = list(ParkingZone.objects.select_related("vehicle_type").order_by("name"))
    occupied = {
        location.parking_zone_id: location
        for location in Location.objects.select_related("vehicle").filter(statut=Location.Statut.PARKED, parking_zone__isnull=False)
    }

    if selected_type != "all":
        zones = [zone for zone in zones if str(zone.vehicle_type_id) == str(selected_type)]

    for zone in zones:
        zone.occupied_location = occupied.get(zone.id)

    occupied_visible_zones = sum(1 for zone in zones if zone.occupied_location)
    total_visible_zones = len(zones)
    type_summary = {}
    for zone in zones:
        type_summary[zone.vehicle_type.name] = type_summary.get(zone.vehicle_type.name, 0) + 1
    visible_zones = zones if show_all_zones else zones[:ZONE_RENDER_LIMIT]
    hidden_zone_count = max(0, len(zones) - len(visible_zones))

    context = {
        **contexte_base(request, "parkings"),
        "page_title": "Places",
        "page_subtitle": "Configurer les places et les types de vehicules" if est_admin(request.user) else "Consulter les places disponibles",
        "zones": visible_zones,
        "hidden_zone_count": hidden_zone_count,
        "type_summary": type_summary.items(),
        "types": VehicleType.objects.all(),
        "selected_type": selected_type,
        "show_all_zones": show_all_zones,
        "total_visible_zones": total_visible_zones,
        "occupied_visible_zones": occupied_visible_zones,
        "available_visible_zones": total_visible_zones - occupied_visible_zones,
    }
    return render(request, "web/parkings.html", context)


@administrateur_requis
def finances(request):
    paid_payments = Payment.objects.filter(status=Payment.Status.PAID)
    by_method = paid_payments.values("method").annotate(amount=Sum("amount")).order_by("method")

    context = {
        **contexte_base(request, "finance"),
        "page_title": "Finance",
        "page_subtitle": "Suivre les encaissements et le rendement du parking",
        "total_paid": paid_payments.aggregate(total=Sum("amount"))["total"] or 0,
        "paid_count": paid_payments.count(),
        "exited_count": Location.objects.filter(statut=Location.Statut.EXITED).count(),
        "by_method": by_method,
        "recent_payments": Payment.objects.select_related("location", "location__vehicle").order_by("-created_at")[:PAYMENT_RENDER_LIMIT],
    }
    return render(request, "web/finance.html", context)


def traiter_formulaire_utilisateurs(request):
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
            definir_role_utilisateur(user, request.POST.get("role", AGENT))
            messages.success(request, "Utilisateur modifie." if user_id else "Utilisateur cree.")

        elif action == "toggle_user":
            user = User.objects.get(pk=request.POST.get("user_id"))
            user.is_active = not user.is_active
            user.save(update_fields=["is_active"])
            messages.success(request, "Utilisateur active." if user.is_active else "Utilisateur desactive.")
        elif action == "delete_user":
            user = User.objects.get(pk=request.POST.get("user_id"))
            if user.pk == request.user.pk:
                messages.error(request, "Tu ne peux pas supprimer ton propre compte connecte.")
                return
            username = user.username
            user.delete()
            messages.success(request, f"Utilisateur {username} supprime.")
    except User.DoesNotExist:
        messages.error(request, "Utilisateur introuvable.")
    except ProtectedError:
        messages.error(request, "Suppression impossible: cet utilisateur est lie a des donnees existantes.")
    except Exception as exc:
        ajouter_erreur_formulaire(request, exc, "Impossible d'enregistrer l'utilisateur.")


@administrateur_requis
def utilisateurs(request):
    if request.method == "POST":
        traiter_formulaire_utilisateurs(request)
        return redirect("web:users")

    user_list = list(User.objects.prefetch_related("groups").order_by("username"))
    edit_user = User.objects.prefetch_related("groups").filter(pk=request.GET.get("edit")).first()

    for user in user_list:
        user.role = recuperer_role(user)
        user.role_label = recuperer_libelle_role(user.role)

    edit_user_role = recuperer_role(edit_user) if edit_user else None

    context = {
        **contexte_base(request, "users"),
        "page_title": "Utilisateurs",
        "page_subtitle": "Creer les comptes et modifier les roles des agents",
        "users": user_list,
        "edit_user": edit_user,
        "edit_user_role": edit_user_role,
        "roles": ROLE_CHOICES,
    }
    return render(request, "web/users.html", context)


@login_required
def recu(request, payment_id):
    payment = get_object_or_404(
        Payment.objects.select_related(
            "location",
            "location__vehicle",
            "location__vehicle__vehicle_type",
            "location__parking_zone",
        ),
        pk=payment_id,
    )
    return render(request, "web/receipt.html", {"payment": payment})


def erreur_403(request, exception=None):
    return render(request, "403.html", status=403)


def erreur_404(request, exception=None):
    return render(request, "404.html", status=404)


def erreur_500(request):
    return render(request, "500.html", status=500)
