from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Officer
from departments.models import Department, Ward


User = get_user_model()


# ==========================================================
# OFFICER SERIALIZER
# ==========================================================

class OfficerSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    full_name = serializers.CharField(
        source="user.full_name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    ward_number = serializers.CharField(
        source="ward.ward_number",
        read_only=True
    )

    ward_name = serializers.CharField(
        source="ward.name",
        read_only=True
    )

    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True
    )

    class Meta:
        model = Officer

        fields = (
            "id",
            "user",
            "user_name",
            "full_name",
            "department",
            "department_name",
            "employee_id",
            "designation",
            "ward",
            "ward_number",
            "ward_name",
            "phone",
            "is_active",
        )

        read_only_fields = (
            "id",
            "user_name",
            "full_name",
            "department_name",
            "ward_number",
            "ward_name",
            "is_active",
        )


# ==========================================================
# CREATE OFFICER
# ==========================================================

class CreateOfficerSerializer(serializers.Serializer):

    full_name = serializers.CharField(
        max_length=150
    )

    username = serializers.CharField(
        max_length=150
    )

    password = serializers.CharField(
        min_length=6,
        write_only=True
    )

    phone = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True
    )

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(
            is_active=True
        )
    )

    employee_id = serializers.CharField(
        max_length=50
    )

    designation = serializers.CharField(
        max_length=100
    )

    ward = serializers.PrimaryKeyRelatedField(
        queryset=Ward.objects.filter(
            is_active=True
        ),
        required=False,
        allow_null=True
    )

    # ------------------------------------------------------
    # CREATE
    # ------------------------------------------------------

    @transaction.atomic
    def create(self, validated_data):

        username = validated_data["username"]
        employee_id = validated_data["employee_id"]

        if User.objects.filter(
            username=username
        ).exists():

            raise serializers.ValidationError({
                "username":
                    "This username already exists."
            })

        if Officer.objects.filter(
            employee_id=employee_id
        ).exists():

            raise serializers.ValidationError({
                "employee_id":
                    "This employee ID already exists."
            })

        user = User.objects.create_user(
            username=username,
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            phone=validated_data.get(
                "phone",
                ""
            ),
            role=User.Role.OFFICER,
            is_active=True,
        )

        officer = Officer.objects.create(
            user=user,
            department=validated_data["department"],
            employee_id=employee_id,
            designation=validated_data["designation"],
            ward=validated_data.get(
                "ward"
            ),
            phone=validated_data.get(
                "phone",
                ""
            ),
        )

        return officer