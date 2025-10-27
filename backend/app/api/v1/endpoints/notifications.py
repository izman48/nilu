from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.notification import (
    NotificationResponse,
    EmailNotificationRequest,
    SMSNotificationRequest,
    BookingNotificationRequest
)
from app.services.notification import notification_service

router = APIRouter()


@router.post("/send-email", response_model=NotificationResponse)
async def send_email_notification(
    request: EmailNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send an email notification"""
    notification = await notification_service.send_email(
        to_email=request.to_email,
        subject=request.subject,
        body=request.body,
        db=db,
        account_id=current_user.account_id,
        booking_id=request.booking_id
    )

    return notification


@router.post("/send-sms", response_model=NotificationResponse)
async def send_sms_notification(
    request: SMSNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send an SMS notification"""
    notification = await notification_service.send_sms(
        to_phone=request.to_phone,
        message=request.message,
        db=db,
        account_id=current_user.account_id,
        booking_id=request.booking_id
    )

    return notification


@router.post("/send-booking-notification", response_model=NotificationResponse)
async def send_booking_notification(
    request: BookingNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a booking-related notification using a template"""
    notification = await notification_service.send_booking_notification(
        booking_id=request.booking_id,
        notification_type=request.notification_type,
        template_name=request.template,
        db=db,
        account_id=current_user.account_id
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Booking not found or notification could not be sent")

    return notification


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    skip: int = 0,
    limit: int = 100,
    booking_id: int = None,
    notification_type: NotificationType = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List notifications with optional filters"""
    query = db.query(Notification).filter(Notification.account_id == current_user.account_id)

    if booking_id:
        query = query.filter(Notification.booking_id == booking_id)

    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)

    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.account_id == current_user.account_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification
