from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "email",
        "full_name",
        "role",
        "phone",
        "department",
        "ward",
        "is_active",
    )

    list_filter = (
        "role",
        "is_active",
        "department",
        "ward",
    )

    search_fields = (
        "username",
        "email",
        "phone",
        "full_name",
    )

    fieldsets = (
        (None, {
            "fields": (
                "username",
                "password",
            )
        }),

        ("Personal Information", {
            "fields": (
                "full_name",
                "first_name",
                "last_name",
                "email",
                "phone",
                "profile_photo",
            )
        }),

        ("CIIP Role & Assignment", {
            "fields": (
                "role",
                "department",
                "ward",
            )
        }),

        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),

        ("Important Dates", {
            "fields": (
                "last_login",
                "date_joined",
            )
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "email",
                "password1",
                "password2",
                "full_name",
                "phone",
                "role",
                "department",
                "ward",
            ),
        }),
    )