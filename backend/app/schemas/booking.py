from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal
from app.models.booking import BookingStatus
from app.schemas.customer import CustomerResponse
from app.schemas.resource import CarResponse, DriverResponse, TourRepResponse
from app.schemas.template import TemplateResponse


class BookingFieldValueCreate(BaseModel):
    field_name: str
    field_value: str


class BookingFieldValueResponse(BaseModel):
    id: int
    field_name: str
    field_value: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingPhotoResponse(BaseModel):
    id: int
    file_path: str
    file_name: str
    photo_type: Optional[str]
    description: Optional[str]
    uploaded_at: datetime
    uploaded_by: int

    class Config:
        from_attributes = True


class BookingBase(BaseModel):
    template_id: int
    customer_id: int
    tour_rep_id: int
    car_id: Optional[int] = None
    driver_id: Optional[int] = None
    start_date: datetime
    end_date: datetime
    total_amount: Optional[Decimal] = None
    currency: str = "LKR"
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    field_values: List[BookingFieldValueCreate] = []


class BookingUpdate(BaseModel):
    template_id: Optional[int] = None
    customer_id: Optional[int] = None
    tour_rep_id: Optional[int] = None
    car_id: Optional[int] = None
    driver_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[BookingStatus] = None
    total_amount: Optional[Decimal] = None
    paid_amount: Optional[Decimal] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    field_values: Optional[List[BookingFieldValueCreate]] = None


class BookingResponse(BookingBase):
    id: int
    booking_number: str
    status: BookingStatus
    paid_amount: Decimal
    account_id: str
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    # Relationships
    customer: CustomerResponse
    tour_rep: TourRepResponse
    car: Optional[CarResponse]
    driver: Optional[DriverResponse]
    template: TemplateResponse
    field_values: List[BookingFieldValueResponse]
    photos: List[BookingPhotoResponse]

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    id: int
    booking_number: str
    template_id: int
    customer_id: int
    customer_name: str
    tour_rep_id: int
    tour_rep_name: str
    start_date: datetime
    end_date: datetime
    status: BookingStatus
    total_amount: Optional[Decimal]
    paid_amount: Decimal
    created_at: datetime
