from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal


# Car Schemas
class CarBase(BaseModel):
    registration_number: str
    make: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    seating_capacity: Optional[int] = None
    daily_rate: Optional[Decimal] = None
    notes: Optional[str] = None


class CarCreate(CarBase):
    is_available: bool = True


class CarUpdate(BaseModel):
    registration_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    is_available: Optional[bool] = None
    seating_capacity: Optional[int] = None
    daily_rate: Optional[Decimal] = None
    notes: Optional[str] = None


class CarResponse(CarBase):
    id: int
    is_available: bool
    account_id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Driver Schemas
class DriverBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    license_number: str
    languages: Optional[str] = None
    daily_rate: Optional[Decimal] = None
    notes: Optional[str] = None


class DriverCreate(DriverBase):
    is_available: bool = True


class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    is_available: Optional[bool] = None
    languages: Optional[str] = None
    daily_rate: Optional[Decimal] = None
    notes: Optional[str] = None


class DriverResponse(DriverBase):
    id: int
    is_available: bool
    account_id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Tour Rep Schemas
class TourRepBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    region: Optional[str] = None
    notes: Optional[str] = None


class TourRepCreate(TourRepBase):
    is_active: bool = True


class TourRepUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    region: Optional[str] = None
    notes: Optional[str] = None


class TourRepResponse(TourRepBase):
    id: int
    is_active: bool
    account_id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
