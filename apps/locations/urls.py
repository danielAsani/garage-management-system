from django.urls import path, include 
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet
app_name = "locations"


router = DefaultRouter()

router.register("locations", LocationViewSet, basename = "locations" )

urlpatterns = [
    path("", include(router.urls))
]
