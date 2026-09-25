from django.db import models


class Department(models.Model):

    name = models.CharField(max_length=150)

    code = models.CharField(
        max_length=30,
        unique=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class Ward(models.Model):

    name = models.CharField(
        max_length=150
    )

    ward_number = models.CharField(
        max_length=20,
        unique=True
    )

    city = models.CharField(
        max_length=100,
        default="Lucknow"
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Ward {self.ward_number} - {self.name}"