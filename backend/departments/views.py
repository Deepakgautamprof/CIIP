from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Department, Ward


# ============================================================
# DEPARTMENT SERIALIZER
# ============================================================

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = (
            "id",
            "name",
            "code",
            "description",
            "is_active",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


# ============================================================
# WARD SERIALIZER
# ============================================================

class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = (
            "id",
            "name",
            "ward_number",
            "city",
            "description",
            "is_active",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


# ============================================================
# DEPARTMENT VIEWSET
# ============================================================

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Only Super Admin can manage departments
        if user.role == "SUPER_ADMIN":
            return Department.objects.all().order_by("name")

        # Other government users can only see active departments
        return Department.objects.filter(
            is_active=True
        ).order_by("name")

    def perform_destroy(self, instance):
        # Don't permanently delete department.
        # Deactivate it instead.
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def create(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can create departments."},
                status=403,
            )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can update departments."},
                status=403,
            )

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can update departments."},
                status=403,
            )

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can deactivate departments."},
                status=403,
            )

        return super().destroy(request, *args, **kwargs)


# ============================================================
# WARD VIEWSET
# ============================================================

class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all().order_by("ward_number")
    serializer_class = WardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Super Admin can see all wards
        if user.role == "SUPER_ADMIN":
            return Ward.objects.all().order_by("ward_number")

        # Ward Admin can see only their assigned ward
        if user.role == "WARD_ADMIN":
            if not user.ward_id:
                return Ward.objects.none()

            return Ward.objects.filter(
                id=user.ward_id,
                is_active=True
            ).order_by("ward_number")

        # Other authenticated government users
        return Ward.objects.filter(
            is_active=True
        ).order_by("ward_number")

    def create(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can create wards."},
                status=403,
            )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can update wards."},
                status=403,
            )

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can update wards."},
                status=403,
            )

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response(
                {"detail": "Only Super Admin can deactivate wards."},
                status=403,
            )

        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # Don't permanently delete ward.
        # Deactivate it instead.
        instance.is_active = False
        instance.save(update_fields=["is_active"])