from django.conf import settings
from django.db import models


class Officer(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="officer_profile"
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.CASCADE,
        related_name="officers"
    )

    employee_id = models.CharField(
        max_length=50,
        unique=True
    )

    designation = models.CharField(
        max_length=100
    )

    # ---------------------------------------------------------
    # WARD
    # ---------------------------------------------------------
    # Optional because an officer may not initially be assigned
    # to a particular ward.
    # ---------------------------------------------------------

    ward = models.ForeignKey(
        "departments.Ward",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="officers"
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return f"{self.employee_id} - {self.user.username}"