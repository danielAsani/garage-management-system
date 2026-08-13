from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MeView, UserViewSet

app_name = "accounts"

router = DefaultRouter()

router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls))
]
