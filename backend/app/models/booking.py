from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)
    booking_number = Column(String, unique=True, nullable=False, index=True)

    # Template
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    template = relationship("Template")

    # Customer
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer")

    # Tour Rep
    tour_rep_id = Column(Integer, ForeignKey("tour_reps.id"), nullable=False)
    tour_rep = relationship("TourRep")

    # Resources (optional, depending on template)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=True)
    car = relationship("Car")

    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    driver = relationship("Driver")

    # Dates
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)

    # Status
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)

    # Financial
    total_amount = Column(Numeric(10, 2))
    paid_amount = Column(Numeric(10, 2), default=0)
    currency = Column(String, default="LKR")

    # Notes
    notes = Column(Text)

    # Created by
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")

    # Dynamic field values
    field_values = relationship("BookingFieldValue", back_populates="booking", cascade="all, delete-orphan")

    # Photos
    photos = relationship("BookingPhoto", back_populates="booking", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BookingFieldValue(Base):
    __tablename__ = "booking_field_values"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)

    # Field reference
    field_name = Column(String, nullable=False)
    field_value = Column(Text)

    # Relationship
    booking = relationship("Booking", back_populates="field_values")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BookingPhoto(Base):
    __tablename__ = "booking_photos"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)

    # Photo details
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    photo_type = Column(String)  # e.g., "before", "after", "during"
    description = Column(Text)

    # Metadata
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship
    booking = relationship("Booking", back_populates="photos")
