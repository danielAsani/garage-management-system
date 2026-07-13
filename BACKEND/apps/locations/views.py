from rest_framework import viewsets
from .models import Location
from .serializers import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet) : 
    queryset = Location.objects.select_related("vehicle", "vehicle__vehicle_type").all()
    serializer_class = LocationSerializer