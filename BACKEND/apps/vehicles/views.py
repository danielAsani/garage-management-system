from rest_framework import viewsets
from .serializers import VehicleTypeSerializer,VehiclePhotoSerializer, VehicleSerializer
from .models import Vehicle, VehiclePhoto, VehicleType

class VehicleTypeViewSet(viewsets.ModelViewSet) : 
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer

class VehicleViewSet(viewsets.ModelViewSet) : 
    queryset = Vehicle.objects.select_related("vehicle_type").all()
    serializer_class = VehicleSerializer


class VehiclePhotoViewSet(viewsets.ModelViewSet) :
    queryset = VehiclePhoto.objects.all()
    serializer_class = VehiclePhotoSerializer