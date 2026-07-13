from rest_framework import viewsets
from .models import Post, UserProfile
from .serializers import PostSerializer, UserProfileSerializer


class PostViewSet(viewsets.ModelViewSet) :
    queryset = Post.objects.all()
    serializer_class = PostSerializer

class UserProfileViewSet(viewsets.ModelViewSet) : 
    queryset = UserProfile.objects.select_related("user", "post").all()
    serializer_class = UserProfileSerializer