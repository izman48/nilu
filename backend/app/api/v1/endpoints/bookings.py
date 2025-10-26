from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import uuid
import os
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission
from app.core.config import settings
from app.models.user import User
from app.models.booking import Booking, BookingFieldValue, BookingPhoto, BookingStatus
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse, BookingPhotoResponse

router = APIRouter()


def generate_booking_number() -> str:
    """Generate a unique booking number."""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_part = str(uuid.uuid4())[:8].upper()
    return f"BK{timestamp}{random_part}"


@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[BookingStatus] = Query(None, description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter bookings starting from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter bookings ending before this date"),
    customer_id: Optional[int] = Query(None, description="Filter by customer"),
    tour_rep_id: Optional[int] = Query(None, description="Filter by tour rep"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all bookings with filters."""
    query = db.query(Booking).filter(Booking.account_id == current_user.account_id)

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    if start_date:
        query = query.filter(Booking.start_date >= start_date)

    if end_date:
        query = query.filter(Booking.end_date <= end_date)

    if customer_id:
        query = query.filter(Booking.customer_id == customer_id)

    if tour_rep_id:
        query = query.filter(Booking.tour_rep_id == tour_rep_id)

    # Order by most recent first
    query = query.order_by(Booking.created_at.desc())

    bookings = query.offset(skip).limit(limit).all()
    return bookings


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_bookings"))
):
    """Create a new booking."""
    # Generate booking number
    booking_number = generate_booking_number()

    # Create booking
    booking_dict = booking_data.dict(exclude={"field_values"})
    booking = Booking(
        **booking_dict,
        booking_number=booking_number,
        account_id=current_user.account_id,
        created_by=current_user.id,
        status=BookingStatus.PENDING
    )

    db.add(booking)
    db.flush()  # Get booking ID

    # Create field values
    for field_value_data in booking_data.field_values:
        field_value = BookingFieldValue(
            **field_value_data.dict(),
            booking_id=booking.id
        )
        db.add(field_value)

    db.commit()
    db.refresh(booking)

    return booking


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get booking by ID."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_edit_bookings"))
):
    """Update booking."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    update_data = booking_data.dict(exclude_unset=True, exclude={"field_values"})
    for field, value in update_data.items():
        setattr(booking, field, value)

    # Update field values if provided
    if booking_data.field_values is not None:
        # Delete existing field values
        db.query(BookingFieldValue).filter(
            BookingFieldValue.booking_id == booking_id
        ).delete()

        # Create new field values
        for field_value_data in booking_data.field_values:
            field_value = BookingFieldValue(
                **field_value_data.dict(),
                booking_id=booking.id
            )
            db.add(field_value)

    db.commit()
    db.refresh(booking)

    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_delete_bookings"))
):
    """Delete booking."""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    db.delete(booking)
    db.commit()

    return None


@router.post("/{booking_id}/photos", response_model=BookingPhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_booking_photo(
    booking_id: int,
    file: UploadFile = File(...),
    photo_type: Optional[str] = Query(None, description="Photo type (before/after/during)"),
    description: Optional[str] = Query(None, description="Photo description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a photo for a booking."""
    # Check booking exists
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )

    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, "bookings", str(booking_id))
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large"
            )
        buffer.write(content)

    # Create photo record
    photo = BookingPhoto(
        booking_id=booking_id,
        file_path=file_path,
        file_name=file.filename,
        photo_type=photo_type,
        description=description,
        uploaded_by=current_user.id
    )

    db.add(photo)
    db.commit()
    db.refresh(photo)

    return photo


@router.get("/{booking_id}/photos", response_model=List[BookingPhotoResponse])
def get_booking_photos(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all photos for a booking."""
    # Check booking exists
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    photos = db.query(BookingPhoto).filter(
        BookingPhoto.booking_id == booking_id
    ).all()

    return photos


@router.delete("/{booking_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking_photo(
    booking_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a booking photo."""
    photo = db.query(BookingPhoto).filter(
        BookingPhoto.id == photo_id,
        BookingPhoto.booking_id == booking_id
    ).first()

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )

    # Check booking belongs to user's account
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Delete file from disk
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)

    # Delete database record
    db.delete(photo)
    db.commit()

    return None
