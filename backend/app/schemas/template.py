from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.template import FieldType


class TemplateFieldBase(BaseModel):
    field_name: str
    field_label: str
    field_type: FieldType
    is_required: bool = True
    order: int = 0
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None


class TemplateFieldCreate(TemplateFieldBase):
    pass


class TemplateFieldUpdate(BaseModel):
    field_name: Optional[str] = None
    field_label: Optional[str] = None
    field_type: Optional[FieldType] = None
    is_required: Optional[bool] = None
    order: Optional[int] = None
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None


class TemplateFieldResponse(TemplateFieldBase):
    id: int
    template_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class TemplateCreate(TemplateBase):
    is_active: bool = True
    fields: List[TemplateFieldCreate] = []


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class TemplateResponse(TemplateBase):
    id: int
    is_active: bool
    account_id: str
    fields: List[TemplateFieldResponse]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
