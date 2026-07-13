from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, UserProfileViewSet

app_name = "accounts"

router = DefaultRouter()

router.register("posts", PostViewSet, basename="posts")
router.register("profiles", UserProfileViewSet, basename="profil")

urlpatterns = [
    path("", include(router.urls))
]
