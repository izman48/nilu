from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    account_id = Column(String, unique=True, index=True, nullable=False)

    # Contact information
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)

    # Business details
    registration_number = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Subscription/plan info (for future use)
    plan_type = Column(String, default="basic", nullable=False)  # basic, pro, enterprise
    max_users = Column(Integer, default=10, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="company")
