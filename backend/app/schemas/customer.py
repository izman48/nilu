from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    passport_number: Optional[str] = None
    id_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    passport_number: Optional[str] = None
    id_number: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    account_id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
