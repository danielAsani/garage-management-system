from django.contrib.auth import get_user_model
from rest_framework import serializers

from .roles import ROLE_CHOICES, AGENT, definir_role_utilisateur, recuperer_role_utilisateur

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=ROLE_CHOICES,
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
        data["role"] = recuperer_role_utilisateur(instance)
        return data

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({
                "password": "Le mot de passe est obligatoire pour creer un utilisateur."
            })

        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role", AGENT)
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        definir_role_utilisateur(user, role)

        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        password = validated_data.pop("password", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role:
            definir_role_utilisateur(instance, role)

        instance.refresh_from_db()

        return instance
