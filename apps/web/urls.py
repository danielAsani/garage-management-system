from django.urls import path

from . import views

app_name = "web"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("vehicles/", views.vehicles, name="vehicles"),
    path("operations/", views.operations, name="operations"),
    path("locations/", views.redirect_locations, name="locations"),
    path("payments/", views.redirect_payments, name="payments"),
    path("parkings/", views.parkings, name="parkings"),
    path("finance/", views.finance, name="finance"),
    path("users/", views.users, name="users"),
    path("receipt/<int:payment_id>/", views.receipt, name="receipt"),
]

