from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/vehicles/", include("apps.vehicles.urls")),
    path("api/locations/", include("apps.locations.urls")),
    path("api/parkings/", include("apps.parkings.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name = "token_refresh"),
    path("", include("apps.web.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler403 = "apps.web.views.erreur_403"
handler404 = "apps.web.views.erreur_404"
handler500 = "apps.web.views.erreur_500"
