from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"


class AuditResourceType(str, enum.Enum):
    BOOKING = "booking"
    CUSTOMER = "customer"
    CAR = "car"
    DRIVER = "driver"
    TOUR_REP = "tour_rep"
    PAYMENT = "payment"
    USER = "user"
    TEMPLATE = "template"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_name = Column(String, nullable=False)  # Denormalized for easier querying

    # What was done
    action = Column(Enum(AuditAction), nullable=False, index=True)
    resource_type = Column(Enum(AuditResourceType), nullable=False, index=True)
    resource_id = Column(Integer, nullable=True)  # ID of the affected resource
    resource_name = Column(String, nullable=True)  # Name/identifier of the resource

    # Details
    description = Column(Text, nullable=True)  # Human-readable description
    details = Column(Text, nullable=True)  # JSON string with additional details

    # IP address and user agent for security
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    # Multi-tenancy
    account_id = Column(String, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User")
