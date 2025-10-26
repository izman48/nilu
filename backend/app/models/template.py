from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class FieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    DATETIME = "datetime"
    DROPDOWN = "dropdown"
    TEXTAREA = "textarea"
    CHECKBOX = "checkbox"
    FILE = "file"
    CAR_SELECT = "car_select"
    DRIVER_SELECT = "driver_select"
    CUSTOMER_SELECT = "customer_select"
    TOUR_REP_SELECT = "tour_rep_select"


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)

    # Template Information
    name = Column(String, nullable=False, index=True)  # e.g., "Rent a Car", "Tour Package", "Car + Driver"
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    # Icon/Color for UI
    icon = Column(String)
    color = Column(String)

    # Fields relationship
    fields = relationship("TemplateField", back_populates="template", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TemplateField(Base):
    __tablename__ = "template_fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)

    # Field Configuration
    field_name = Column(String, nullable=False)  # e.g., "pickup_date", "car"
    field_label = Column(String, nullable=False)  # e.g., "Pickup Date", "Select Car"
    field_type = Column(Enum(FieldType), nullable=False)
    is_required = Column(Boolean, default=True)

    # Display Order
    order = Column(Integer, default=0)

    # Options for dropdown fields (JSON array)
    options = Column(JSON)  # e.g., ["Option 1", "Option 2"]

    # Validation
    placeholder = Column(String)
    help_text = Column(String)

    # Relationship
    template = relationship("Template", back_populates="fields")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
