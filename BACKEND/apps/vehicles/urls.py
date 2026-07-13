from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, VehicleTypeViewSet, VehiclePhotoViewSet

app_name = "vehicles"

router = DefaultRouter()

router.register("vehicles", VehicleViewSet, basename="vehicle")
router.register("types", VehicleTypeViewSet, basename="vehicle-type")
router.register("photos", VehiclePhotoViewSet, basename="vehicle-photo")

urlpatterns = [
    path("", include(router.urls))
]