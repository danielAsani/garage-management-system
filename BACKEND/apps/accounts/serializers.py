from rest_framework import serializers
from .models import Post, UserProfile

class PostSerializer(serializers.ModelSerializer) : 
    class Meta : 
        model = Post
        fields = "__all__"


class UserProfileSerializer(serializers.ModelSerializer):
    post_name = serializers.CharField(source="post.name", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user",
            "role",
            "post",
            "post_name",
        ]