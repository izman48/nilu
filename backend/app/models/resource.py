from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)

    # Car Information
    registration_number = Column(String, unique=True, nullable=False, index=True)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer)
    color = Column(String)

    # Status
    is_available = Column(Boolean, default=True)

    # Additional Details
    seating_capacity = Column(Integer)
    daily_rate = Column(Numeric(10, 2))
    notes = Column(Text)
    image_path = Column(String)  # Path to car image

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)

    # Driver Information
    full_name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    email = Column(String)
    license_number = Column(String, unique=True, nullable=False)

    # Status
    is_available = Column(Boolean, default=True)

    # Additional Details
    languages = Column(String)  # Comma-separated
    daily_rate = Column(Numeric(10, 2))
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TourRep(Base):
    __tablename__ = "tour_reps"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)

    # Tour Rep Information
    full_name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    email = Column(String)

    # Status
    is_active = Column(Boolean, default=True)

    # Additional Details
    region = Column(String)  # Area they operate in
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
