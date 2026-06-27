from datetime import date, datetime, timedelta
from typing import List
from app.models.db_models import Product, ProductEvent

def compute_tags(product: Product, events: List[ProductEvent]) -> List[str]:
    tags = []
    today = date.today()

    # Status tags
    status = product.status
    if status == "operational":
        tags.append("operational")
    elif status == "faulty":
        tags.append("faulty")
    elif status == "under_maintenance":
        tags.append("under_maintenance")
    elif status == "decommissioned":
        tags.append("decommissioned")

    # Maintenance tags
    if product.next_maintenance:
        try:
            nm = datetime.strptime(product.next_maintenance, "%Y-%m-%d").date()
            days_until = (nm - today).days
            if days_until < 0:
                tags.append("maintenance_overdue")
            elif days_until <= 30:
                tags.append("maintenance_due")
        except Exception:
            pass

    # Recently repaired
    repair_events = [e for e in events if e.event_type in ("repair", "maintenance", "overhaul")]
    if repair_events:
        try:
            latest = max(datetime.strptime(e.event_date, "%Y-%m-%d").date() for e in repair_events)
            if (today - latest).days <= 90:
                tags.append("recently_repaired")
        except Exception:
            pass

    # High repair frequency
    repairs_last_year = [
        e for e in repair_events
        if (today - datetime.strptime(e.event_date, "%Y-%m-%d").date()).days <= 365
    ]
    if len(repairs_last_year) >= 3:
        tags.append("high_repair_frequency")

    # Warranty tags
    if product.warranty_expiry:
        try:
            we = datetime.strptime(product.warranty_expiry, "%Y-%m-%d").date()
            days_left = (we - today).days
            if days_left < 0:
                tags.append("warranty_expired")
            elif days_left <= 90:
                tags.append("warranty_expiring_soon")
            else:
                tags.append("under_warranty")
        except Exception:
            pass

    # Age tags
    age_years = today.year - product.manufacture_year
    if age_years >= 10:
        tags.append("aging_asset")
    elif age_years <= 2:
        tags.append("new_asset")

    return list(dict.fromkeys(tags))  # deduplicate preserving order
