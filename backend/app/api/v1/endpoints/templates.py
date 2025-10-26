from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission
from app.models.user import User
from app.models.template import Template, TemplateField
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse, TemplateFieldCreate

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all templates."""
    query = db.query(Template).filter(Template.account_id == current_user.account_id)

    if active_only:
        query = query.filter(Template.is_active == True)

    templates = query.offset(skip).limit(limit).all()
    return templates


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_templates"))
):
    """Create a new template with fields."""
    # Create template
    template_dict = template_data.dict(exclude={"fields"})
    template = Template(**template_dict, account_id=current_user.account_id)
    db.add(template)
    db.flush()  # Get template ID

    # Create fields
    for field_data in template_data.fields:
        field = TemplateField(**field_data.dict(), template_id=template.id)
        db.add(field)

    db.commit()
    db.refresh(template)

    return template


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get template by ID."""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.account_id == current_user.account_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    return template


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_templates"))
):
    """Update template (does not update fields, use separate endpoint)."""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.account_id == current_user.account_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_templates"))
):
    """Delete template."""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.account_id == current_user.account_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    db.delete(template)
    db.commit()

    return None
