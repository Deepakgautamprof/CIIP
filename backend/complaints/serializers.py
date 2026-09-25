from rest_framework import serializers

from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):

    # ------------------------------------------------------
    # READ-ONLY WARD INFORMATION
    # ------------------------------------------------------

    ward_number = serializers.CharField(
        source="ward.ward_number",
        read_only=True
    )

    ward_name = serializers.CharField(
        source="ward.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    officer_name = serializers.CharField(
        source="officer.user.full_name",
        read_only=True
    )

    class Meta:
        model = Complaint

        fields = (
            "id",
            "complaint_id",
            "citizen",
            "category",
            "description",
            "image",
            "latitude",
            "longitude",
            "address",
            "ward",
            "ward_number",
            "ward_name",
            "priority",
            "status",
            "department",
            "department_name",
            "officer",
            "officer_name",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "complaint_id",
            "citizen",
            "ward",
            "ward_number",
            "ward_name",
            "status",
            "department",
            "department_name",
            "officer_name",
            "created_at",
            "updated_at",
        )


# ==========================================================
# ASSIGN COMPLAINT
# ==========================================================

class ComplaintAssignmentSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Complaint

        fields = (
            "department",
            "officer",
            "status",
        )


# ==========================================================
# STATUS UPDATE
# ==========================================================

class ComplaintStatusSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Complaint

        fields = (
            "status",
        )