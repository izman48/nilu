from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    notification_type = Column(SQLEnum(NotificationType), nullable=False)
    recipient = Column(String(255), nullable=False)  # Email address or phone number
    subject = Column(String(255))  # For emails
    message = Column(Text, nullable=False)
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.PENDING)
    error_message = Column(Text)

    # Optional references
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Metadata
    account_id = Column(String(255), nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", backref="notifications")
    user = relationship("User", backref="notifications")
