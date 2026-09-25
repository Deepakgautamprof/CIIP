from django.contrib import admin

from .models import Department, Ward


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "code",
    )

    list_filter = (
        "is_active",
    )


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):

    list_display = (
        "ward_number",
        "name",
        "city",
        "is_active",
        "created_at",
    )

    search_fields = (
        "ward_number",
        "name",
        "city",
    )

    list_filter = (
        "city",
        "is_active",
    )

    ordering = (
        "ward_number",
    )