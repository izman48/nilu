from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum


class NotificationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class NotificationBase(BaseModel):
    notification_type: NotificationType
    recipient: str
    subject: Optional[str] = None
    message: str
    booking_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    status: NotificationStatus
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmailNotificationRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    booking_id: Optional[int] = None


class SMSNotificationRequest(BaseModel):
    to_phone: str
    message: str
    booking_id: Optional[int] = None


class BookingNotificationRequest(BaseModel):
    booking_id: int
    notification_type: NotificationType
    template: str  # e.g., "booking_confirmation", "booking_reminder", "payment_reminder"
