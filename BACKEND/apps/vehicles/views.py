from rest_framework import viewsets
from .serializers import VehicleTypeSerializer,VehiclePhotoSerializer, VehicleSerializer
from .models import Vehicle, VehiclePhoto, VehicleType
from apps.permissions import CanAccessVehiclePhotos, CanAccessVehicles, CanAccessVehicleTypes

class VehicleTypeViewSet(viewsets.ModelViewSet) : 
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer
    permission_classes = [CanAccessVehicleTypes]

class VehicleViewSet(viewsets.ModelViewSet) : 
    queryset = Vehicle.objects.select_related("vehicle_type").all()
    serializer_class = VehicleSerializer
    permission_classes = [CanAccessVehicles]


class VehiclePhotoViewSet(viewsets.ModelViewSet) :
    queryset = VehiclePhoto.objects.all()
    serializer_class = VehiclePhotoSerializer
    permission_classes = [CanAccessVehiclePhotos]
