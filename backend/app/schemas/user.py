from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.AGENT


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    can_create_bookings: bool = True
    can_edit_bookings: bool = True
    can_delete_bookings: bool = False
    can_manage_users: bool = False
    can_manage_templates: bool = False
    can_view_analytics: bool = False
    can_manage_resources: bool = False


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    can_create_bookings: Optional[bool] = None
    can_edit_bookings: Optional[bool] = None
    can_delete_bookings: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_manage_templates: Optional[bool] = None
    can_view_analytics: Optional[bool] = None
    can_manage_resources: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    can_create_bookings: bool
    can_edit_bookings: bool
    can_delete_bookings: bool
    can_manage_users: bool
    can_manage_templates: bool
    can_view_analytics: bool
    can_manage_resources: bool
    account_id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
