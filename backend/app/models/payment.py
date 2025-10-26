from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    POS = "pos"
    OTHER = "other"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    REFUNDED = "refunded"
    FAILED = "failed"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)

    # Booking reference
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    booking = relationship("Booking")

    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="LKR")
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)

    # Receipt information
    receipt_number = Column(String, index=True)
    receipt_file_path = Column(String)  # Path to uploaded receipt image/PDF

    # Transaction details
    transaction_reference = Column(String)  # For bank transfers, card payments
    payment_date = Column(DateTime(timezone=True), nullable=False)

    # Notes
    notes = Column(Text)

    # Recorded by
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
