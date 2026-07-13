import string


def generate_zone_suffix(index):
    letters = string.ascii_uppercase

    first = letters[(index // (26 * 26)) % 26]
    second = letters[(index // 26) % 26]
    third = letters[index % 26]

    return first + second + third

