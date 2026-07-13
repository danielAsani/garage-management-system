from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/vehicles/", include("apps.vehicles.urls")),
    path("api/locations/", include("apps.locations.urls")),
    path("api/parkings/", include("apps.parkings.urls")),
    path("api/payments/", include("apps.payments.urls")),
]