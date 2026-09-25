from django.conf import settings
from django.db import models


class Complaint(models.Model):

    class Category(models.TextChoices):
        POTHOLE = "POTHOLE", "Pothole"
        ROAD_DAMAGE = "ROAD_DAMAGE", "Road Damage"
        GARBAGE = "GARBAGE", "Garbage"
        STREETLIGHT = "STREETLIGHT", "Broken Streetlight"
        WATER_LEAKAGE = "WATER_LEAKAGE", "Water Leakage"
        DRAINAGE = "DRAINAGE", "Drainage Problem"
        ILLEGAL_DUMPING = "ILLEGAL_DUMPING", "Illegal Dumping"
        ENCROACHMENT = "ENCROACHMENT", "Encroachment"
        TRAFFIC_SIGNAL = "TRAFFIC_SIGNAL", "Traffic Signal Problem"
        OTHER = "OTHER", "Other"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Approved"
        ASSIGNED = "ASSIGNED", "Assigned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        VERIFIED = "VERIFIED", "Verified"
        CLOSED = "CLOSED", "Closed"
        REOPENED = "REOPENED", "Reopened"

    complaint_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True
    )

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints"
    )

    category = models.CharField(
        max_length=30,
        choices=Category.choices
    )

    description = models.TextField()

    image = models.ImageField(
        upload_to="complaints/",
        blank=True,
        null=True
    )

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    address = models.TextField(
        blank=True,
        null=True
    )

    ward = models.ForeignKey(
        "departments.Ward",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints"
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints"
    )

    officer = models.ForeignKey(
        "officers.Officer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def save(self, *args, **kwargs):

        if not self.complaint_id:

            super().save(*args, **kwargs)

            self.complaint_id = (
                f"CIIP-{self.created_at.year}-{self.id:06d}"
            )

            super().save(
                update_fields=["complaint_id"]
            )

        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return self.complaint_id