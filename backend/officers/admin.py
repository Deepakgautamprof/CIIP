from django.contrib import admin

from .models import Officer


@admin.register(Officer)
class OfficerAdmin(admin.ModelAdmin):

    list_display = (
        "employee_id",
        "user",
        "department",
        "designation",
        "ward",
        "is_active",
    )

    list_filter = (
        "department",
        "designation",
        "is_active",
    )

    search_fields = (
        "employee_id",
        "user__username",
        "user__email",
        "ward",
    )