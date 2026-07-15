from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserProfile

User = get_user_model()



class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user",
            "username",
            "role",
        ]


class UserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=UserProfile.Role.choices,
        required=False,
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "password",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, "profile", None)
        data["role"] = profile.role if profile else None
        return data

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({
                "password": "Le mot de passe est obligatoire pour creer un utilisateur."
            })

        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role", UserProfile.Role.AGENT)
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"role": role},
        )
        profile.role = role
        profile.save()

        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        password = validated_data.pop("password", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        profile, _ = UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                "role": UserProfile.Role.ADMIN if instance.is_superuser else UserProfile.Role.AGENT
            },
        )

        if role:
            profile.role = role
            profile.save()

        instance.refresh_from_db()

        return instance
