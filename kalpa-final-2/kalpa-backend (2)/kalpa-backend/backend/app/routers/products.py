from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import exists, and_, or_, distinct
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.db import get_db
from app.models.db_models import Product, ProductEvent, ProductModel
from app.models.user import User
from app.schemas.schemas import (
    ProductDetailOut, SearchPayload, SearchResponse,
    ProductSearchResult, FilterOptions, IdentifyPayload,
)
from app.services.tag_engine import compute_tags

router = APIRouter()


def product_to_detail(p: Product) -> ProductDetailOut:
    tags = compute_tags(p, p.events)
    return ProductDetailOut(
        product_id=p.product_id,
        qr_code=p.qr_code,
        serial_number=p.serial_number,
        location=p.location,
        site=p.site,
        manufacture_year=p.manufacture_year,
        installation_date=p.installation_date,
        status=p.status,
        warranty_expiry=p.warranty_expiry,
        model=p.model,
        tags=tags,
        last_maintenance=p.last_maintenance,
        next_maintenance=p.next_maintenance,
        notes=p.notes,
        events=[
            {
                "id": e.id,
                "event_type": e.event_type,
                "event_date": e.event_date,
                "description": e.description,
                "parts_replaced": e.parts_replaced,
                "performed_by": e.performed_by,
                "cost_inr": e.cost_inr,
            }
            for e in p.events
        ],
    )


@router.get("/product/{product_id}", response_model=ProductDetailOut)
def get_product(product_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.query(Product).filter(
        or_(Product.product_id == product_id, Product.qr_code == product_id)
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return product_to_detail(p)


@router.post("/products/search", response_model=SearchResponse)
def search_products(payload: SearchPayload, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    today = date.today()

    q = db.query(Product)

    # ── Exact-match filters pushed to SQL ────────────────────────────────────
    if payload.product_type:
        q = q.join(Product.model).filter(ProductModel.product_type == payload.product_type)

    if payload.location:
        q = q.filter(Product.location == payload.location)

    if payload.manufacture_year:
        q = q.filter(Product.manufacture_year == payload.manufacture_year)

    # ── Date-based filters pushed to SQL (possible after DATE column migration) ──

    # maintenance_due  → next_maintenance is not null AND <= today + 30 days
    #                    (covers both maintenance_due and maintenance_overdue tags)
    if payload.maintenance_due:
        q = q.filter(
            Product.next_maintenance.isnot(None),
            Product.next_maintenance <= today + timedelta(days=30),
        )

    # recently_repaired → EXISTS a repair/maintenance/overhaul event in the last 90 days
    if payload.recently_repaired:
        ninety_days_ago = today - timedelta(days=90)
        q = q.filter(
            exists().where(
                and_(
                    ProductEvent.product_id == Product.product_id,
                    ProductEvent.event_type.in_(["repair", "maintenance", "overhaul"]),
                    ProductEvent.event_date >= ninety_days_ago,
                )
            )
        )

    # ── Count before pagination (single query, no Python list) ───────────────
    total = q.count()

    # ── Pagination in SQL ─────────────────────────────────────────────────────
    products = q.offset(payload.offset).limit(payload.limit).all()

    # ── Build response — compute_tags only for the current page ──────────────
    results = [
        ProductSearchResult(
            product_id=p.product_id,
            product_type=p.model.product_type,
            location=p.location,
            manufacture_year=p.manufacture_year,
            status=p.status,
            tags=compute_tags(p, p.events),
        )
        for p in products
    ]

    return SearchResponse(results=results, total=total)


@router.get("/meta/options", response_model=FilterOptions)
def get_filter_options(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    types = [r[0] for r in db.query(distinct(ProductModel.product_type)).all()]
    locations = [r[0] for r in db.query(distinct(Product.location)).all()]
    years = sorted(
        [r[0] for r in db.query(distinct(Product.manufacture_year)).all()],
        reverse=True,
    )
    return FilterOptions(types=sorted(types), locations=sorted(locations), years=years)


@router.post("/identify")
def identify_product(payload: IdentifyPayload, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = None

    if payload.product_id:
        p = db.query(Product).filter(Product.product_id == payload.product_id).first()
    if not p and payload.qr_code:
        p = db.query(Product).filter(Product.qr_code == payload.qr_code).first()
    if not p and payload.search_text:
        st = f"%{payload.search_text}%"
        p = db.query(Product).filter(
            or_(
                Product.product_id.ilike(st),
                Product.qr_code.ilike(st),
                Product.serial_number.ilike(st),
                Product.location.ilike(st),
            )
        ).first()

    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    return product_to_detail(p)
