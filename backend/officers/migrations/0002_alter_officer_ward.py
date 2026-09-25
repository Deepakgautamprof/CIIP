from django.db import migrations, models
import django.db.models.deletion


def clean_old_officer_ward_values(apps, schema_editor):
    Officer = apps.get_model("officers", "Officer")
    Ward = apps.get_model("departments", "Ward")

    # Old Officer ward values were stored as text.
    # Example: "42" means Ward Number 42, whose database ID is 2.
    ward_42 = Ward.objects.filter(ward_number="42").first()

    if ward_42:
        Officer.objects.filter(ward="42").update(
            ward=str(ward_42.pk)
        )

    # Any old value that does not match an existing Ward
    # should become unassigned instead of creating invalid FK data.
    valid_ward_ids = {
        str(ward.pk)
        for ward in Ward.objects.all()
    }

    for officer in Officer.objects.exclude(ward__isnull=True):
        if str(officer.ward) not in valid_ward_ids:
            officer.ward = None
            officer.save(update_fields=["ward"])


class Migration(migrations.Migration):

    dependencies = [
        ("officers", "0001_initial"),
        ("departments", "0002_ward"),
    ]

    operations = [
        migrations.RunPython(
            clean_old_officer_ward_values,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="officer",
            name="ward",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="officers",
                to="departments.ward",
            ),
        ),
    ]