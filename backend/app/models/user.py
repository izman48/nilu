from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.AGENT, nullable=False)
    is_active = Column(Boolean, default=True)

    # Permissions
    can_create_bookings = Column(Boolean, default=True)
    can_edit_bookings = Column(Boolean, default=True)
    can_delete_bookings = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    can_manage_templates = Column(Boolean, default=False)
    can_view_analytics = Column(Boolean, default=False)
    can_manage_resources = Column(Boolean, default=False)

    # Company relationship for multi-tenancy
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    account_id = Column(String, default="default", nullable=False, index=True)  # Keep for backward compatibility

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="users")
