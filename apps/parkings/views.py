from rest_framework import viewsets
from .models import ParkingZone
from .serializers import ParkingZoneSerializer
from rest_framework.response import Response
from rest_framework import status
from .utils import generer_suffixe_place
from django.shortcuts import get_object_or_404
from django.db import transaction
from apps.vehicles.models import VehicleType
from apps.permissions import CanAccessParkingConfig

class ParkingZoneViewSet(viewsets.ModelViewSet) : 
    serializer_class = ParkingZoneSerializer
    permission_classes = [CanAccessParkingConfig]

    def get_queryset(self):
        return ParkingZone.objects.select_related("vehicle_type").order_by("name")

    def create(self, request, *args, **kwargs) : 
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

                suffix = generer_suffixe_place(index)
                name = f"{vehicle_type.name}-{suffix}"
                index += 1

                if ParkingZone.objects.filter(name=name).exists():
                    continue

                zone = ParkingZone.objects.create(
                    vehicle_type=vehicle_type,
                    name=name,
                )

                created_zones.append(zone)

        serializer = self.get_serializer(created_zones, many=True)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
