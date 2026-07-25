from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

app_name = "payments"

router = DefaultRouter()

router.register("payments", PaymentViewSet, basename="payments")

urlpatterns = [
    path('', include(router.urls))
]
