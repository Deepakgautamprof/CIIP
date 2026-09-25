from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Complaint
from .serializers import (
    ComplaintSerializer,
    ComplaintAssignmentSerializer,
    ComplaintStatusSerializer,
)

from officers.models import Officer


class ComplaintViewSet(viewsets.ModelViewSet):

    queryset = (
        Complaint.objects
        .all()
        .select_related(
            "citizen",
            "ward",
            "department",
            "officer",
            "officer__user",
        )
        .order_by("-created_at")
    )

    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    # =========================================================
    # GET COMPLAINTS ACCORDING TO USER ROLE
    # =========================================================

    def get_queryset(self):

        user = self.request.user

        base_queryset = (
            Complaint.objects
            .select_related(
                "citizen",
                "ward",
                "department",
                "officer",
                "officer__user",
            )
            .order_by("-created_at")
        )

        # -----------------------------------------------------
        # CITIZEN
        # -----------------------------------------------------

        if user.role == "CITIZEN":

            return base_queryset.filter(
                citizen=user
            )

        # -----------------------------------------------------
        # DEPARTMENT ADMIN
        # -----------------------------------------------------

        if user.role == "DEPARTMENT_ADMIN":

            if not user.department_id:
                return Complaint.objects.none()

            return base_queryset.filter(
                department_id=user.department_id
            )

        # -----------------------------------------------------
        # OFFICER
        # -----------------------------------------------------

        if user.role == "OFFICER":

            return base_queryset.filter(
                officer__user_id=user.id
            )

        # -----------------------------------------------------
        # WARD ADMIN
        # -----------------------------------------------------

        if user.role == "WARD_ADMIN":

            if not user.ward_id:
                return Complaint.objects.none()

            return base_queryset.filter(
                ward_id=user.ward_id
            )

        # -----------------------------------------------------
        # SUPER ADMIN
        # -----------------------------------------------------

        if user.role == "SUPER_ADMIN":

            return base_queryset

        return Complaint.objects.none()

    # =========================================================
    # CREATE COMPLAINT
    # =========================================================

    def perform_create(
        self,
        serializer
    ):

        from departments.models import Department

        category = self.request.data.get(
            "category"
        )

        category_department_map = {

            "POTHOLE":
                "Public Works Department",

            "ROAD_DAMAGE":
                "Public Works Department",

            "GARBAGE":
                "Sanitation Department",

            "ILLEGAL_DUMPING":
                "Sanitation Department",

            "STREETLIGHT":
                "Electricity Department",

            "TRAFFIC_SIGNAL":
                "Electricity Department",

            "WATER_LEAKAGE":
                "Water Supply Department",

            "DRAINAGE":
                "Municipal Corporation",

            "ENCROACHMENT":
                "Municipal Corporation",

            "OTHER":
                "Municipal Corporation",
        }

        department_name = category_department_map.get(
            category
        )

        department = None

        if department_name:

            department = (
                Department.objects
                .filter(
                    name=department_name,
                    is_active=True
                )
                .first()
            )

        # -----------------------------------------------------
        # WARD IS NOT ACCEPTED FROM CITIZEN
        #
        # GIS will assign it later.
        # -----------------------------------------------------

        serializer.save(
            citizen=self.request.user,
            department=department,
            ward=None,
        )

    # =========================================================
    # ASSIGN COMPLAINT
    # =========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="assign"
    )
    def assign_complaint(
        self,
        request,
        pk=None
    ):

        complaint = self.get_object()

        if request.user.role not in [
            "SUPER_ADMIN",
            "DEPARTMENT_ADMIN"
        ]:

            return Response(
                {
                    "detail":
                        "You are not allowed to assign complaints."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -----------------------------------------------------
        # DEPARTMENT ADMIN
        # -----------------------------------------------------

        if request.user.role == "DEPARTMENT_ADMIN":

            if not request.user.department_id:

                return Response(
                    {
                        "detail":
                            "Department Admin is not assigned to a department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if (
                complaint.department_id
                != request.user.department_id
            ):

                return Response(
                    {
                        "detail":
                            "You cannot assign complaints from another department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        officer_id = request.data.get(
            "officer"
        )

        if not officer_id:

            return Response(
                {
                    "detail":
                        "Officer is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            officer = (
                Officer.objects
                .select_related(
                    "department",
                    "ward",
                    "user"
                )
                .get(
                    id=officer_id
                )
            )

        except (
            Officer.DoesNotExist,
            ValueError,
            TypeError
        ):

            return Response(
                {
                    "detail":
                        "Selected officer does not exist."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------------
        # OFFICER ACTIVE CHECK
        # -----------------------------------------------------

        if (
            not officer.is_active
            or not officer.user.is_active
        ):

            return Response(
                {
                    "detail":
                        "Selected officer is inactive."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------------
        # DEPARTMENT CHECK
        # -----------------------------------------------------

        if (
            complaint.department_id
            and officer.department_id
            != complaint.department_id
        ):

            return Response(
                {
                    "detail":
                        "Officer must belong to the complaint department."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------------
        # WARD CHECK
        # -----------------------------------------------------
        # If both complaint and officer have a ward,
        # they should match.
        # -----------------------------------------------------

        if (
            complaint.ward_id
            and officer.ward_id
            and complaint.ward_id
            != officer.ward_id
        ):

            return Response(
                {
                    "detail":
                        "Officer is not assigned to the complaint ward."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint.officer = officer

        if not complaint.department_id:
            complaint.department = officer.department

        complaint.status = Complaint.Status.ASSIGNED

        complaint.save()

        return Response(
            ComplaintSerializer(
                complaint,
                context={
                    "request": request
                }
            ).data,
            status=status.HTTP_200_OK
        )

    # =========================================================
    # STATUS UPDATE
    # =========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="status"
    )
    def update_status(
        self,
        request,
        pk=None
    ):

        complaint = self.get_object()

        # -----------------------------------------------------
        # CITIZEN
        # -----------------------------------------------------

        if request.user.role == "CITIZEN":

            return Response(
                {
                    "detail":
                        "Citizens cannot update complaint status."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -----------------------------------------------------
        # DEPARTMENT ADMIN
        # -----------------------------------------------------

        if request.user.role == "DEPARTMENT_ADMIN":

            if not request.user.department_id:

                return Response(
                    {
                        "detail":
                            "Department Admin is not assigned to a department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if (
                complaint.department_id
                != request.user.department_id
            ):

                return Response(
                    {
                        "detail":
                            "You cannot update complaints from another department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------------
        # WARD ADMIN
        # -----------------------------------------------------

        if request.user.role == "WARD_ADMIN":

            if not request.user.ward_id:

                return Response(
                    {
                        "detail":
                            "Ward Admin is not assigned to a ward."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if complaint.ward_id != request.user.ward_id:

                return Response(
                    {
                        "detail":
                            "You cannot update complaints from another ward."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------------
        # OFFICER
        # -----------------------------------------------------

        if request.user.role == "OFFICER":

            try:
                officer = request.user.officer_profile

            except Exception:

                return Response(
                    {
                        "detail":
                            "Officer profile not found."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if complaint.officer_id != officer.id:

                return Response(
                    {
                        "detail":
                            "This complaint is not assigned to you."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------------
        # GET NEW STATUS
        # -----------------------------------------------------

        new_status = request.data.get(
            "status"
        )

        if not new_status:

            return Response(
                {
                    "detail":
                        "Status is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------------
        # STATUS TRANSITIONS
        # -----------------------------------------------------

        allowed_transitions = {

            Complaint.Status.SUBMITTED: {
                Complaint.Status.UNDER_REVIEW,
            },

            Complaint.Status.UNDER_REVIEW: {
                Complaint.Status.APPROVED,
                Complaint.Status.ASSIGNED,
            },

            Complaint.Status.APPROVED: {
                Complaint.Status.ASSIGNED,
            },

            Complaint.Status.ASSIGNED: {
                Complaint.Status.IN_PROGRESS,
            },

            Complaint.Status.IN_PROGRESS: {
                Complaint.Status.RESOLVED,
            },

            Complaint.Status.RESOLVED: {
                Complaint.Status.VERIFIED,
                Complaint.Status.REOPENED,
            },

            Complaint.Status.REOPENED: {
                Complaint.Status.UNDER_REVIEW,
            },

            Complaint.Status.VERIFIED: {
                Complaint.Status.CLOSED,
            },

            Complaint.Status.CLOSED: set(),
        }

        current_status = complaint.status

        if new_status not in Complaint.Status.values:

            return Response(
                {
                    "detail":
                        "Invalid complaint status."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------------
        # OFFICER RESTRICTION
        # -----------------------------------------------------

        if request.user.role == "OFFICER":

            allowed_officer_statuses = {
                Complaint.Status.IN_PROGRESS,
                Complaint.Status.RESOLVED,
            }

            if new_status not in allowed_officer_statuses:

                return Response(
                    {
                        "detail":
                            "Officers can only move complaints to In Progress or Resolved."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------------
        # CHECK TRANSITION
        # -----------------------------------------------------

        if new_status not in allowed_transitions.get(
            current_status,
            set()
        ):

            return Response(
                {
                    "detail":
                        (
                            f"Invalid status transition: "
                            f"{current_status} -> {new_status}"
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint.status = new_status

        complaint.save(
            update_fields=[
                "status",
                "updated_at"
            ]
        )

        return Response(
            ComplaintSerializer(
                complaint,
                context={
                    "request": request
                }
            ).data,
            status=status.HTTP_200_OK
        )

    # =========================================================
    # VERIFY / REOPEN
    # =========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="verify"
    )
    def verify_complaint(
        self,
        request,
        pk=None
    ):

        complaint = self.get_object()

        if request.user.role not in [
            "DEPARTMENT_ADMIN",
            "SUPER_ADMIN"
        ]:

            return Response(
                {
                    "detail":
                        "Only Department Admin or Super Admin can verify complaints."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -----------------------------------------------------
        # DEPARTMENT ADMIN SCOPE
        # -----------------------------------------------------

        if request.user.role == "DEPARTMENT_ADMIN":

            if not request.user.department_id:

                return Response(
                    {
                        "detail":
                            "Department Admin is not assigned to a department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if (
                complaint.department_id
                != request.user.department_id
            ):

                return Response(
                    {
                        "detail":
                            "You cannot verify complaints from another department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------------
        # ONLY RESOLVED
        # -----------------------------------------------------

        if complaint.status != Complaint.Status.RESOLVED:

            return Response(
                {
                    "detail":
                        "Only resolved complaints can be verified."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        action_type = request.data.get(
            "action"
        )

        # -----------------------------------------------------
        # VERIFY
        # -----------------------------------------------------

        if action_type == "VERIFY":

            complaint.status = (
                Complaint.Status.VERIFIED
            )

            complaint.save(
                update_fields=[
                    "status",
                    "updated_at"
                ]
            )

            return Response(
                {
                    "message":
                        "Complaint verified successfully.",

                    "complaint_id":
                        complaint.complaint_id,

                    "status":
                        complaint.status
                },
                status=status.HTTP_200_OK
            )

        # -----------------------------------------------------
        # REOPEN
        # -----------------------------------------------------

        if action_type == "REOPEN":

            complaint.status = (
                Complaint.Status.REOPENED
            )

            complaint.save(
                update_fields=[
                    "status",
                    "updated_at"
                ]
            )

            return Response(
                {
                    "message":
                        "Complaint reopened for further action.",

                    "complaint_id":
                        complaint.complaint_id,

                    "status":
                        complaint.status
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "detail":
                    "Action must be VERIFY or REOPEN."
            },
            status=status.HTTP_400_BAD_REQUEST
        )