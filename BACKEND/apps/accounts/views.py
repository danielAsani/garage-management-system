from rest_framework import viewsets
from .models import  UserProfile
from .serializers import  UserProfileSerializer
from apps.permissions import IsAdminRole


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminRole]
