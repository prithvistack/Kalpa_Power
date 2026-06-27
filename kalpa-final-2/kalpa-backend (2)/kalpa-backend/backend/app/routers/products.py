from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.dependencies import get_current_user
from app.database.db import get_db
from app.models.db_models import Product, ProductEvent
from app.models.user import User
from app.schemas.schemas import (
    ProductDetailOut, SearchPayload, SearchResponse,
    ProductSearchResult, FilterOptions, IdentifyPayload
)
from app.services.tag_engine import compute_tags
from datetime import date, datetime

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
    q = db.query(Product)

    if payload.product_type:
        q = q.join(Product.model).filter(Product.model.has(product_type=payload.product_type))
    if payload.location:
        q = q.filter(Product.location == payload.location)
    if payload.manufacture_year:
        q = q.filter(Product.manufacture_year == payload.manufacture_year)

    all_products = q.all()

    today = date.today()

    def matches_filters(p: Product) -> bool:
        tags = compute_tags(p, p.events)
        if payload.maintenance_due:
            if "maintenance_due" not in tags and "maintenance_overdue" not in tags:
                return False
        if payload.recently_repaired:
            if "recently_repaired" not in tags:
                return False
        return True

    filtered = [p for p in all_products if matches_filters(p)]
    total = len(filtered)
    page = filtered[payload.offset: payload.offset + payload.limit]

    results = []
    for p in page:
        tags = compute_tags(p, p.events)
        results.append(ProductSearchResult(
            product_id=p.product_id,
            product_type=p.model.product_type,
            location=p.location,
            manufacture_year=p.manufacture_year,
            status=p.status,
            tags=tags,
        ))

    return SearchResponse(results=results, total=total)


@router.get("/meta/options", response_model=FilterOptions)
def get_filter_options(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.db_models import ProductModel
    from sqlalchemy import distinct

    types = [r[0] for r in db.query(distinct(ProductModel.product_type)).all()]
    locations = [r[0] for r in db.query(distinct(Product.location)).all()]
    years = sorted(
        [r[0] for r in db.query(distinct(Product.manufacture_year)).all()],
        reverse=True
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
                Product.product_id.like(st),
                Product.qr_code.like(st),
                Product.serial_number.like(st),
                Product.location.like(st),
            )
        ).first()

    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    return product_to_detail(p)
