import os
import random
import sys
import uuid
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import SessionLocal, engine
from app.models.db_models import Base, Product, ProductEvent, ProductModel, ScanLog

Base.metadata.create_all(bind=engine)

TYPES = {
    "Transformer": "TRA",
    "Generator": "GEN",
    "UPS": "UPS",
    "Motor": "MOT",
    "Solar Panel": "SOL",
    "Cable": "CAB",
    "Switchgear": "SWG",
}

MODELS = [
    ("Voltamp T-63KVA", "Transformer", 63, 11000, 97.8),
    ("Voltamp T-160KVA", "Transformer", 160, 11000, 98.2),
    ("Kirloskar DG-100", "Generator", 100, 415, 88.5),
    ("Kirloskar DG-250", "Generator", 250, 415, 91.0),
    ("Emerson UPS-20K", "UPS", 20, 230, 96.0),
    ("Delta UPS-40K", "UPS", 40, 415, 96.5),
    ("BHEL IM-15", "Motor", 15, 415, 93.0),
    ("BHEL IM-37", "Motor", 37, 415, 94.5),
    ("Waaree WS-540", "Solar Panel", 0.54, 48, 21.1),
    ("Tata TP-600", "Solar Panel", 0.6, 48, 21.8),
    ("Polycab HT-1Core", "Cable", 0, 11000, 99.5),
    ("L&T MCC Panel", "Switchgear", 0, 415, 99.0),
]

CITIES = ["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"]
TECHNICIANS = ["Rajesh Kumar", "Anita Sharma", "Mohan Patil", "Priya Nair", "Suresh Iyer", "Arjun Reddy"]
EVENTS = ["maintenance", "repair", "inspection"]


def random_date_between(start: date, end: date) -> date:
    return start + timedelta(days=random.randint(0, max(1, (end - start).days)))


def seed(total_assets: int = 420) -> None:
    random.seed(42)
    db = SessionLocal()
    try:
        db.query(ScanLog).delete()
        db.query(ProductEvent).delete()
        db.query(Product).delete()
        db.query(ProductModel).delete()
        db.commit()

        model_rows = []
        for name, product_type, power, voltage, efficiency in MODELS:
            model_id = "MDL-" + "".join(ch if ch.isalnum() else "-" for ch in name.upper()).strip("-")
            row = ProductModel(
                model_id=model_id,
                model_name=name,
                product_type=product_type,
                rated_power_kw=power,
                efficiency_pct=efficiency,
                voltage_v=voltage,
                current_a=round((power * 1000 / max(voltage, 1)), 2) if power else 0,
                weight_kg=random.choice([45, 95, 180, 450, 980, 1200, 2800]),
                cooling_type=random.choice(["Air Cooled", "Oil Cooled", "Fan Cooled", "Natural", "TEFC", "N/A"]),
                ip_rating=random.choice(["IP20", "IP23", "IP42", "IP55", "IP65", "N/A"]),
            )
            model_rows.append(row)
            db.add(row)
        db.commit()

        counters = {code: 0 for code in TYPES.values()}
        today = date.today()

        for index in range(total_assets):
            model = random.choice(model_rows)
            code = TYPES[model.product_type]
            counters[code] += 1
            number = counters[code]
            product_id = f"KPL-{code}-{number:04d}"
            qr_code = f"KPL-QR-{code}-{number:04d}"
            mfg_year = random.choice(range(2012, 2026))
            install = random_date_between(date(mfg_year, 1, 1), date(min(mfg_year + 1, 2026), 12, 31))

            if index % 17 == 0:
                status = "faulty"
            elif index % 23 == 0:
                status = "under_maintenance"
            elif index % 61 == 0:
                status = "decommissioned"
            else:
                status = "operational"

            last_maintenance = today - timedelta(days=random.choice([20, 45, 85, 120, 190, 390]))
            if index % 9 == 0:
                next_maintenance = today - timedelta(days=random.randint(1, 45))
            elif index % 7 == 0:
                next_maintenance = today + timedelta(days=random.randint(1, 25))
            else:
                next_maintenance = today + timedelta(days=random.randint(45, 260))

            city = random.choice(CITIES)
            product = Product(
                product_id=product_id,
                qr_code=qr_code,
                serial_number=f"SN-{code}-{random.randint(100000, 999999)}",
                location=city,
                site=f"{city} Site {random.randint(1, 8)}",
                manufacture_year=mfg_year,
                installation_date=install.isoformat(),
                status=status,
                warranty_expiry=date(mfg_year + random.choice([2, 3, 5, 7]), 12, 31).isoformat(),
                model_id=model.model_id,
                last_maintenance=last_maintenance.isoformat(),
                next_maintenance=next_maintenance.isoformat(),
                notes=random.choice([None, "High load zone", "Dust-prone area", "Critical backup asset"]),
            )
            db.add(product)
            db.flush()

            for event_index in range(random.randint(3, 10)):
                event_type = random.choice(EVENTS)
                if index % 11 == 0 and event_index < 3:
                    event_type = "repair"
                    event_date = today - timedelta(days=random.randint(1, 330))
                elif index % 13 == 0 and event_index == 0:
                    event_type = "maintenance"
                    event_date = today - timedelta(days=random.randint(1, 80))
                else:
                    event_date = random_date_between(install, today)

                cost = None
                if event_type == "maintenance":
                    cost = random.randint(2500, 25000)
                elif event_type == "repair":
                    cost = random.randint(8000, 95000)

                db.add(ProductEvent(
                    id=str(uuid.uuid4()),
                    product_id=product_id,
                    event_type=event_type,
                    event_date=event_date.isoformat(),
                    description=f"{event_type.title()} completed for {model.model_name}",
                    parts_replaced=random.choice([None, "Bearing set", "Control card", "Filter kit", "Contactor"]),
                    performed_by=random.choice(TECHNICIANS),
                    cost_inr=cost,
                ))

        db.commit()
        print(f"Seeded {total_assets} products with realistic events.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
