from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentBase(BaseModel):
    booking_id: int
    amount: Decimal
    currency: str = "LKR"
    payment_method: PaymentMethod
    payment_date: datetime
    receipt_number: Optional[str] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    payment_status: PaymentStatus = PaymentStatus.COMPLETED


class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    payment_status: Optional[PaymentStatus] = None
    payment_date: Optional[datetime] = None
    receipt_number: Optional[str] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    payment_status: PaymentStatus
    receipt_file_path: Optional[str]
    account_id: str
    recorded_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
