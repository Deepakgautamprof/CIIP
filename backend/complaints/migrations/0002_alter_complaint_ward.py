from django.db import migrations, models
import django.db.models.deletion


def clean_old_ward_values(apps, schema_editor):
    Complaint = apps.get_model("complaints", "Complaint")

    # Complaint 3 and 4 were stored as "ward 42".
    # Migration 0003 already converted these to Ward primary key "2".
    #
    # Complaint 5 had "52", but there is no Ward with ward_number "52".
    # Therefore, keep it as unassigned (NULL) instead of creating fake data.
    Complaint.objects.filter(ward="52").update(ward=None)


class Migration(migrations.Migration):

    dependencies = [
        ("complaints", "0003_fix_old_ward_data"),
        ("departments", "0002_ward"),
    ]

    operations = [
        migrations.RunPython(
            clean_old_ward_values,
            migrations.RunPython.noop,
        ),

        migrations.AlterField(
            model_name="complaint",
            name="ward",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="complaints",
                to="departments.ward",
            ),
        ),
    ]