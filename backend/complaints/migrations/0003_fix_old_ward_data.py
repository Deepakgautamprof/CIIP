from django.db import migrations


def fix_old_ward_values(apps, schema_editor):
    Complaint = apps.get_model("complaints", "Complaint")
    Ward = apps.get_model("departments", "Ward")

    ward_42 = Ward.objects.filter(ward_number="42").first()

    if ward_42:
        Complaint.objects.filter(ward="ward 42").update(
            ward=str(ward_42.pk)
        )
        Complaint.objects.filter(ward="Ward 42").update(
            ward=str(ward_42.pk)
        )
        Complaint.objects.filter(ward="42").update(
            ward=str(ward_42.pk)
        )

    ward_52 = Ward.objects.filter(ward_number="52").first()

    if ward_52:
        Complaint.objects.filter(ward="52").update(
            ward=str(ward_52.pk)
        )


class Migration(migrations.Migration):

    dependencies = [
        ("complaints", "0001_initial"),
        ("departments", "0002_ward"),
    ]

    operations = [
        migrations.RunPython(
            fix_old_ward_values,
            migrations.RunPython.noop,
        ),
    ]


