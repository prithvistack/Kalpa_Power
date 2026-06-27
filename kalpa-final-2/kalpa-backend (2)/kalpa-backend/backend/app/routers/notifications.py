from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.dependencies import get_current_user
from app.database.db import get_db
from app.models.db_models import Notification
from app.models.user import User
from app.schemas.schemas import NotificationOut, NotificationListOut
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListOut)
def get_notifications(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    notifications = db.query(Notification).order_by(desc(Notification.timestamp)).all()
    unread_count = db.query(Notification).filter(Notification.read == False).count()
    return NotificationListOut(
        notifications=[NotificationOut.from_orm(n) for n in notifications],
        unread_count=unread_count,
    )


@router.post("/read-all")
def read_all_notifications(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    db.query(Notification).update({"read": True})
    db.commit()
    return {"status": "ok", "message": "All notifications marked as read"}
