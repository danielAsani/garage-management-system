from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import PaymentSerializer
from .models import Payment
from apps.locations.models import Location
from apps.permissions import CanManageOperations


def get_limit(request, default=None, maximum=500):
    raw_limit = request.query_params.get("limit")

    if raw_limit is None:
        return default

    try:
        limit = int(raw_limit)
    except ValueError:
        return default

    if limit <= 0:
        return default

    return min(limit, maximum)


class PaymentViewSet(viewsets.ModelViewSet) :
    queryset = Payment.objects.select_related("location", "location__vehicle").order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [CanManageOperations]

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action == "list":
            status = self.request.query_params.get("status")
            if status:
                queryset = queryset.filter(status=status)

            limit = get_limit(self.request)
            if limit:
                queryset = queryset[:limit]

        return queryset

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        paid_payments = Payment.objects.filter(status=Payment.Status.PAID)
        recent_payments = self.get_serializer(
            self.queryset[:100],
            many=True,
        ).data

        by_method = {
            row["method"]: row["amount"] or 0
            for row in paid_payments.values("method").annotate(amount=Sum("amount"))
        }

        return Response({
            "total_paid": paid_payments.aggregate(total=Sum("amount"))["total"] or 0,
            "paid_count": paid_payments.count(),
            "exited_count": Location.objects.filter(statut=Location.Statut.EXITED).count(),
            "by_method": by_method,
            "recent_payments": recent_payments,
        })
