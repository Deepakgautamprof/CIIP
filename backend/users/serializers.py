from rest_framework import serializers

from .models import User
from departments.models import Department, Ward


# ==========================================================
# CITIZEN REGISTRATION
# ==========================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "phone",
            "password",
        )

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            full_name=validated_data.get(
                "full_name",
                ""
            ),
            phone=validated_data.get(
                "phone"
            ),
            role=User.Role.CITIZEN,
        )

        return user


# ==========================================================
# CREATE DEPARTMENT ADMIN
# ==========================================================

class CreateDepartmentAdminSerializer(
    serializers.ModelSerializer
):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(
            is_active=True
        ),
        write_only=True
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "phone",
            "password",
            "department",
        )

    def create(self, validated_data):

        department = validated_data.pop(
            "department"
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            full_name=validated_data.get(
                "full_name",
                ""
            ),
            phone=validated_data.get(
                "phone"
            ),
            role=User.Role.DEPARTMENT_ADMIN,
            department=department,
        )

        return user


# ==========================================================
# UPDATE DEPARTMENT ADMIN
# ==========================================================

class UpdateDepartmentAdminSerializer(
    serializers.ModelSerializer
):

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(
            is_active=True
        ),
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "phone",
            "department",
            "is_active",
        )


# ==========================================================
# CREATE WARD ADMIN
# ==========================================================

class CreateWardAdminSerializer(
    serializers.ModelSerializer
):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    ward = serializers.PrimaryKeyRelatedField(
        queryset=Ward.objects.filter(
            is_active=True
        )
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "phone",
            "password",
            "ward",
        )

    def create(self, validated_data):

        ward = validated_data.pop(
            "ward"
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            full_name=validated_data.get(
                "full_name",
                ""
            ),
            phone=validated_data.get(
                "phone"
            ),
            role=User.Role.WARD_ADMIN,
            ward=ward,
        )

        return user


# ==========================================================
# UPDATE WARD ADMIN
# ==========================================================

class UpdateWardAdminSerializer(
    serializers.ModelSerializer
):

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=6
    )

    ward = serializers.PrimaryKeyRelatedField(
        queryset=Ward.objects.filter(
            is_active=True
        ),
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "phone",
            "ward",
            "is_active",
            "password",
        )

    def update(
        self,
        instance,
        validated_data
    ):

        password = validated_data.pop(
            "password",
            None
        )

        for attr, value in validated_data.items():

            setattr(
                instance,
                attr,
                value
            )

        if password:
            instance.set_password(
                password
            )

        instance.save()

        return instance


# ==========================================================
# PROFILE
# ==========================================================

class ProfileSerializer(
    serializers.ModelSerializer
):

    profile_photo_url = serializers.SerializerMethodField()

    ward_details = serializers.SerializerMethodField()

    department_details = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "full_name",
            "phone",
            "role",
            "department",
            "department_details",
            "ward",
            "ward_details",
            "profile_photo",
            "profile_photo_url",
        )

        read_only_fields = (
            "id",
            "username",
            "role",
            "department",
            "department_details",
            "ward",
            "ward_details",
            "profile_photo_url",
        )

    def get_ward_details(
        self,
        obj
    ):

        if not obj.ward:
            return None

        return {
            "id": obj.ward.id,
            "ward_number": obj.ward.ward_number,
            "name": obj.ward.name,
            "city": obj.ward.city,
            "description": obj.ward.description,
            "is_active": obj.ward.is_active,
        }

    def get_department_details(
        self,
        obj
    ):

        if not obj.department:
            return None

        return {
            "id": obj.department.id,
            "name": obj.department.name,
            "code": obj.department.code,
            "is_active": obj.department.is_active,
        }

    def get_profile_photo_url(
        self,
        obj
    ):

        request = self.context.get(
            "request"
        )

        if obj.profile_photo:

            if request:
                return request.build_absolute_uri(
                    obj.profile_photo.url
                )

            return obj.profile_photo.url

        return None