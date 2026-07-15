from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import  MeView, UserProfileViewSet, UserViewSet

app_name = "accounts"

router = DefaultRouter()

router.register("users", UserViewSet, basename="user")
router.register("profiles", UserProfileViewSet, basename="profil")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls))
]
