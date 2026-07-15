from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import  UserProfile
from .serializers import  UserProfileSerializer, UserSerializer
from apps.permissions import IsAdminRole

User = get_user_model()


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminRole]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("profile").order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)

        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "role": profile.role if profile else None,
        })
