from rest_framework import viewsets
from .models import Parking, ParkingZone
from .serializers import ParkingSerializer, ParkingZoneSerializer
from rest_framework.response import Response
from rest_framework import status
from .utils import generate_zone_suffix
from django.shortcuts import get_object_or_404
from django.db import transaction
from apps.vehicles.models import VehicleType
from apps.permissions import CanAccessParkingConfig

class ParkingViewSet(viewsets.ModelViewSet) :
    queryset = Parking.objects.all().order_by("name")
    serializer_class = ParkingSerializer
    permission_classes = [CanAccessParkingConfig]

class ParkingZoneViewSet(viewsets.ModelViewSet) : 
    queryset = ParkingZone.objects.select_related("parking", "vehicle_type").order_by("parking__name", "name")
    serializer_class = ParkingZoneSerializer
    permission_classes = [CanAccessParkingConfig]
    def create(self, request, *args, **kwargs) : 
        parking_id = request.data.get("parking")
        vehicle_type_id = request.data.get("vehicle_type")
        quantity = request.data.get("quantity")

        try :
            quantity = int(quantity)
        except (TypeError, ValueError) : 
            return Response(
                {"quantity" : "La quantite doit etre un nombre entier"},
                status= status.HTTP_400_BAD_REQUEST
            )
        if quantity <= 0:
            return Response(
                {"quantity": "La quantite doit etre superieure a 0."},
                status=status.HTTP_400_BAD_REQUEST
            )
        parking = get_object_or_404(Parking, id=parking_id)
        vehicle_type = get_object_or_404(VehicleType, id=vehicle_type_id)
        created_zones = []
        index = 0
        max_zone_count = 26 * 26 * 26

        with transaction.atomic():
            while len(created_zones) < quantity:
                if index >= max_zone_count:
                    return Response(
                        {"quantity": "Impossible de generer autant de zones pour ce type."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                suffix = generate_zone_suffix(index)
                name = f"{vehicle_type.name}-{suffix}"
                index += 1

                if ParkingZone.objects.filter(parking=parking, name=name).exists():
                    continue

                zone = ParkingZone.objects.create(
                    parking=parking,
                    vehicle_type=vehicle_type,
                    name=name,
                )

                created_zones.append(zone)

        serializer = self.get_serializer(created_zones, many=True)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
