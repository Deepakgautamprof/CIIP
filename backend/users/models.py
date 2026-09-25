from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    full_name = models.CharField(
        max_length=150,
        blank=True
    )

    profile_photo = models.ImageField(
        upload_to="profile_photos/",
        blank=True,
        null=True
    )

    class Role(models.TextChoices):
        CITIZEN = "CITIZEN", "Citizen"
        OFFICER = "OFFICER", "Officer"
        DEPARTMENT_ADMIN = "DEPARTMENT_ADMIN", "Department Admin"
        WARD_ADMIN = "WARD_ADMIN", "Ward Admin"
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.CITIZEN
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_users"
    )

    ward = models.ForeignKey(
        "departments.Ward",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    def __str__(self):
        return f"{self.username} - {self.role}"