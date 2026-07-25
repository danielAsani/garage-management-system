from django import template

from apps.web.utils import dollars, money

register = template.Library()


@register.filter
def fc(value):
    return money(value)


@register.filter
def usd(value):
    return dollars(value)


@register.filter
def get_item(mapping, key):
    if not mapping:
        return None
    return mapping.get(key)
