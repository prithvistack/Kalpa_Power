from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database.db import get_db
from app.models.db_models import Product, ProductEvent, ProductModel
from app.models.user import User
from app.schemas.admin import (
    GenerateQrRequest,
    GenerateQrResponse,
    ProductCreateRequest,
    ProductEventCreateRequest,
)
from app.services.audit_service import AuditAction, log_action
from app.services.notification_service import create_product_notification
from app.services.qr_service import generate_qr_base64

router = APIRouter(prefix="/admin", tags=["admin"])


def _model_id(model: str) -> str:
    return "MDL-" + "".join(ch if ch.isalnum() else "-" for ch in model.upper()).strip("-")[:40]


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.post("/product", status_code=status.HTTP_201_CREATED)
def create_product(
    request: Request,
    payload: ProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if db.query(Product).filter(Product.product_id == payload.product_id).first():
        raise HTTPException(status_code=409, detail="Product already exists")

    model_id = _model_id(payload.model)
    model = db.query(ProductModel).filter(ProductModel.model_id == model_id).first()
    if not model:
        model = ProductModel(
            model_id=model_id,
            model_name=payload.model,
            product_type=payload.type,
            rated_power_kw=payload.power_rating or 0,
            efficiency_pct=payload.efficiency or 0,
            voltage_v=payload.voltage or 0,
            current_a=0,
            weight_kg=0,
            cooling_type="N/A",
            ip_rating="N/A",
        )
        db.add(model)
        db.flush()

    product = Product(
        product_id=payload.product_id,
        qr_code=payload.qr_code,
        serial_number=payload.serial_number or f"SN-{payload.product_id}",
        location=payload.location,
        site=payload.site,
        manufacture_year=payload.manufacture_year,
        installation_date=payload.installation_date,
        status=payload.status,
        warranty_expiry=payload.warranty_expiry,
        model_id=model.model_id,
    )
    db.add(product)
    db.commit()

    create_product_notification(db, payload.product_id, f"New asset added: {payload.product_id}")

    log_action(AuditAction.PRODUCT_CREATED, user=current_user,
               entity_type="PRODUCT", entity_id=payload.product_id,
               new={"product_id": payload.product_id, "location": payload.location,
                    "status": payload.status},
               ip=_ip(request))

    return {"status": "created", "product_id": product.product_id}


@router.post("/event", status_code=status.HTTP_201_CREATED)
def create_event(
    request: Request,
    payload: ProductEventCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "technician")),
):
    product = db.query(Product).filter(Product.product_id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    event = ProductEvent(
        id=str(uuid4()),
        product_id=payload.product_id,
        event_type=payload.event_type,
        event_date=payload.date,
        description=payload.description,
        parts_replaced=payload.parts_replaced,
        performed_by=payload.technician,
        cost_inr=payload.cost,
    )
    db.add(event)
    db.commit()

    log_action(AuditAction.EVENT_CREATED, user=current_user,
               entity_type="PRODUCT_EVENT", entity_id=event.id,
               new={"product_id": payload.product_id, "event_type": payload.event_type,
                    "date": str(payload.date)},
               ip=_ip(request))

    return {"status": "created", "event_id": event.id}


@router.post("/generate-qr", response_model=GenerateQrResponse)
def generate_qr(
    payload: GenerateQrRequest,
    current_user: User = Depends(require_role("admin", "technician")),
):
    url = f"{payload.base_url.rstrip('/')}/{payload.qr_code}"
    return GenerateQrResponse(
        url=url,
        qr_code=payload.qr_code,
        png_base64=generate_qr_base64(url),
    )
