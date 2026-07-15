from django.db.models import Q
from rest_framework import viewsets
from .models import Location
from .serializers import LocationSerializer
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


class LocationViewSet(viewsets.ModelViewSet) : 
    queryset = Location.objects.select_related(
        "vehicle",
        "vehicle__vehicle_type",
        "parking_zone",
        "parking_zone__parking",
    ).order_by("-heure_entree")
    serializer_class = LocationSerializer
    permission_classes = [CanManageOperations]

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action == "list":
            statut = self.request.query_params.get("statut")
            if statut:
                queryset = queryset.filter(statut=statut)

            search = self.request.query_params.get("search")
            if search:
                queryset = queryset.filter(
                    Q(code__icontains=search) | Q(vehicle__plaque__icontains=search)
                )

            limit = get_limit(self.request)
            if limit:
                queryset = queryset[:limit]

        return queryset
