from rest_framework import viewsets
from .serializers import VehicleTypeSerializer,VehiclePhotoSerializer, VehicleSerializer
from .models import Vehicle, VehiclePhoto, VehicleType
from apps.permissions import CanAccessVehiclePhotos, CanAccessVehicles, CanAccessVehicleTypes


def get_limit(request, default=None, maximum=100):
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


class VehicleTypeViewSet(viewsets.ModelViewSet) : 
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer
    permission_classes = [CanAccessVehicleTypes]

class VehicleViewSet(viewsets.ModelViewSet) : 
    queryset = Vehicle.objects.select_related("vehicle_type").all()
    serializer_class = VehicleSerializer
    permission_classes = [CanAccessVehicles]


class VehiclePhotoViewSet(viewsets.ModelViewSet) :
    queryset = VehiclePhoto.objects.select_related("vehicle").order_by("-updated_at")
    serializer_class = VehiclePhotoSerializer
    permission_classes = [CanAccessVehiclePhotos]

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action == "list":
            vehicle = self.request.query_params.get("vehicle")
            if vehicle:
                queryset = queryset.filter(vehicle_id=vehicle)

            limit = get_limit(self.request)
            if limit:
                queryset = queryset[:limit]

        return queryset
