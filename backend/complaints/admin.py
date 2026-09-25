from django.contrib import admin

from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):

    list_display = (
        "complaint_id",
        "citizen",
        "category",
        "priority",
        "status",
        "department",
        "officer",
        "created_at",
    )

    list_filter = (
        "category",
        "priority",
        "status",
        "department",
    )

    search_fields = (
        "complaint_id",
        "description",
        "address",
        "ward",
        "citizen__username",
    )

    readonly_fields = (
        "complaint_id",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )