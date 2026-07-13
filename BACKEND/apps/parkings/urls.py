from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import ParkingViewSet,ParkingZoneViewSet

app_name = "parkings"

router = DefaultRouter()
router.register("parkings", ParkingViewSet, basename="parkings")
router.register("zones", ParkingZoneViewSet, basename="parking-zone")

urlpatterns = [
    path("", include(router.urls))
]