import secrets
import string

from django.utils import timezone


def generate_code():
    date_part = timezone.localdate().strftime("%Y%m%d")
    characters = string.ascii_uppercase + string.digits
    random_part = "".join(secrets.choice(characters) for _ in range(6))
    return f"{date_part}{random_part}"
