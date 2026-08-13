from django.db import migrations, models


def make_zone_names_unique(apps, schema_editor):
    ParkingZone = apps.get_model("parkings", "ParkingZone")
    used_names = set()

    for zone in ParkingZone.objects.order_by("name", "id"):
        base_name = zone.name or f"PLACE-{zone.id}"
        candidate = base_name
        suffix = 2

        while candidate.lower() in used_names:
            candidate = f"{base_name}-{suffix}"
            suffix += 1

        if candidate != zone.name:
            zone.name = candidate
            zone.save(update_fields=["name"])

        used_names.add(candidate.lower())


class Migration(migrations.Migration):

    dependencies = [
        ("parkings", "0002_parkingzone_unique_zone_name_per_parking"),
    ]

    operations = [
        migrations.RunPython(make_zone_names_unique, migrations.RunPython.noop),
        migrations.RemoveConstraint(
            model_name="parkingzone",
            name="unique_zone_name_per_parking",
        ),
        migrations.RemoveField(
            model_name="parkingzone",
            name="parking",
        ),
        migrations.DeleteModel(
            name="Parking",
        ),
        migrations.AddConstraint(
            model_name="parkingzone",
            constraint=models.UniqueConstraint(fields=("name",), name="unique_parking_zone_name"),
        ),
    ]
