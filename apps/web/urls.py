from django.urls import path

from . import views

app_name = "web"

urlpatterns = [
    path("", views.tableau_de_bord, name="dashboard"),
    path("login/", views.connexion, name="login"),
    path("logout/", views.deconnexion, name="logout"),
    path("profile/", views.profil, name="profile"),
    path("profile/update/", views.modifier_profil, name="update_profile"),
    path("vehicles/", views.vehicules, name="vehicles"),
    path("entree/", views.entree, name="entry"),
    path("sortie/", views.sortie, name="exit"),
    path("historique/", views.historique, name="history"),
    path("jeton/<int:location_id>/", views.jeton_stationnement, name="parking_token"),
    path("paiement/<int:location_id>/", views.paiement, name="payment"),
    path("parkings/", views.places, name="parkings"),
    path("finance/", views.finances, name="finance"),
    path("users/", views.utilisateurs, name="users"),
    path("receipt/<int:payment_id>/", views.recu, name="receipt"),
]
