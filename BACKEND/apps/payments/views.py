from rest_framework import viewsets
from .serializers import PaymentSerializer
from .models import Payment


class PaymentViewSet(viewsets.ModelViewSet) :
    queryset = Payment.objects.select_related("location", "location__vehicle").all()
    serializer_class = PaymentSerializer