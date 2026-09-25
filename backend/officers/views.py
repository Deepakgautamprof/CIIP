from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Officer
from .serializers import (
    OfficerSerializer,
    CreateOfficerSerializer,
)


class OfficerViewSet(viewsets.ModelViewSet):

    queryset = (
        Officer.objects
        .all()
        .select_related(
            "user",
            "department",
            "ward"
        )
        .order_by("employee_id")
    )

    serializer_class = OfficerSerializer
    permission_classes = [IsAuthenticated]

    # =========================================================
    # GET OFFICERS ACCORDING TO ROLE
    # =========================================================

    def get_queryset(self):

        user = self.request.user

        base_queryset = (
            Officer.objects
            .select_related(
                "user",
                "department",
                "ward"
            )
            .order_by("employee_id")
        )

        # -----------------------------------------------------
        # SUPER ADMIN
        # -----------------------------------------------------

        if user.role == "SUPER_ADMIN":

            return base_queryset

        # -----------------------------------------------------
        # DEPARTMENT ADMIN
        # -----------------------------------------------------

        if user.role == "DEPARTMENT_ADMIN":

            if not user.department_id:
                return Officer.objects.none()

            return base_queryset.filter(
                department_id=user.department_id
            )

        # -----------------------------------------------------
        # WARD ADMIN
        # -----------------------------------------------------

        if user.role == "WARD_ADMIN":

            if not user.ward_id:
                return Officer.objects.none()

            return base_queryset.filter(
                ward_id=user.ward_id
            )

        # -----------------------------------------------------
        # OFFICER
        # -----------------------------------------------------

        if user.role == "OFFICER":

            return base_queryset.filter(
                user_id=user.id
            )

        return Officer.objects.none()

    # =========================================================
    # CREATE OFFICER
    # ONLY SUPER ADMIN
    # =========================================================

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != "SUPER_ADMIN":

            return Response(
                {
                    "detail":
                        "Only Super Admin can create officers."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateOfficerSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        officer = serializer.save()

        return Response(
            OfficerSerializer(
                officer,
                context={
                    "request": request
                }
            ).data,
            status=status.HTTP_201_CREATED
        )

    # =========================================================
    # UPDATE OFFICER
    # ONLY SUPER ADMIN
    # =========================================================

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != "SUPER_ADMIN":

            return Response(
                {
                    "detail":
                        "Only Super Admin can update officers."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(
            request,
            *args,
            **kwargs
        )

    # =========================================================
    # PARTIAL UPDATE OFFICER
    # ONLY SUPER ADMIN
    # =========================================================

    def partial_update(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != "SUPER_ADMIN":

            return Response(
                {
                    "detail":
                        "Only Super Admin can update officers."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        return super().partial_update(
            request,
            *args,
            **kwargs
        )

    # =========================================================
    # DELETE OFFICER
    # ONLY SUPER ADMIN
    # =========================================================

    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        if request.user.role != "SUPER_ADMIN":

            return Response(
                {
                    "detail":
                        "Only Super Admin can delete officers."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        officer = self.get_object()

        user = officer.user

        officer.delete()
        user.delete()

        return Response(
            {
                "detail":
                    "Officer deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT
        )