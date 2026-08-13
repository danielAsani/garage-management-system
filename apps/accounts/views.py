from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .roles import recuperer_role_utilisateur
from .serializers import UserSerializer
from apps.permissions import IsAdminRole

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related("groups").order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "role": recuperer_role_utilisateur(request.user),
        })
