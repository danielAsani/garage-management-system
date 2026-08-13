from django import template

from apps.web.utils import formater_dollars, formater_fc

register = template.Library()


@register.filter
def fc(value):
    return formater_fc(value)


@register.filter
def usd(value):
    return formater_dollars(value)


@register.filter
def element(mapping, key):
    if not mapping:
        return None
    return mapping.get(key)
