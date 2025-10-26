from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)

    # Basic Information
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, index=True)
    phone = Column(String, index=True)

    # Additional Information
    country = Column(String)
    passport_number = Column(String)
    id_number = Column(String)
    address = Column(Text)

    # Notes
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
