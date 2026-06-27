from datetime import date, timedelta
from typing import List
from app.models.db_models import Product, ProductEvent

def compute_tags(product: Product, events: List[ProductEvent]) -> List[str]:
    tags = []
    today = date.today()

    # Status
    if product.status in ("operational", "faulty", "under_maintenance", "decommissioned"):
        tags.append(product.status)

    # Maintenance tags — next_maintenance is now a date object
    if product.next_maintenance:
        days_until = (product.next_maintenance - today).days
        if days_until < 0:
            tags.append("maintenance_overdue")
        elif days_until <= 30:
            tags.append("maintenance_due")

    # Recently repaired — event_date is now a date object
    repair_events = [e for e in events if e.event_type in ("repair", "maintenance", "overhaul")]
    if repair_events:
        latest = max(e.event_date for e in repair_events)
        if (today - latest).days <= 90:
            tags.append("recently_repaired")

    # High repair frequency
    repairs_last_year = [e for e in repair_events if (today - e.event_date).days <= 365]
    if len(repairs_last_year) >= 3:
        tags.append("high_repair_frequency")

    # Warranty tags — warranty_expiry is now a date object
    if product.warranty_expiry:
        days_left = (product.warranty_expiry - today).days
        if days_left < 0:
            tags.append("warranty_expired")
        elif days_left <= 90:
            tags.append("warranty_expiring_soon")
        else:
            tags.append("under_warranty")

    # Age
    age_years = today.year - product.manufacture_year
    if age_years >= 10:
        tags.append("aging_asset")
    elif age_years <= 2:
        tags.append("new_asset")

    return list(dict.fromkeys(tags))  # deduplicate preserving order
