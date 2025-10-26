from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.payment import Payment
from app.models.booking import Booking
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse

router = APIRouter()


@router.get("/", response_model=List[PaymentResponse])
def list_payments(
    skip: int = 0,
    limit: int = 100,
    booking_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all payments."""
    query = db.query(Payment).filter(Payment.account_id == current_user.account_id)

    if booking_id:
        query = query.filter(Payment.booking_id == booking_id)

    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return payments


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payment record."""
    # Verify booking exists and belongs to user's account
    booking = db.query(Booking).filter(
        Booking.id == payment_data.booking_id,
        Booking.account_id == current_user.account_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Create payment
    payment = Payment(
        **payment_data.dict(),
        account_id=current_user.account_id,
        recorded_by=current_user.id
    )

    db.add(payment)

    # Update booking paid amount
    booking.paid_amount = (booking.paid_amount or 0) + payment.amount

    db.commit()
    db.refresh(payment)

    return payment


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment by ID."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.account_id == current_user.account_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update payment."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.account_id == current_user.account_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    # Store old amount for booking update
    old_amount = payment.amount

    update_data = payment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)

    # Update booking paid amount if payment amount changed
    if payment_data.amount is not None and payment_data.amount != old_amount:
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.paid_amount = (booking.paid_amount or 0) - old_amount + payment.amount

    db.commit()
    db.refresh(payment)

    return payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete payment."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.account_id == current_user.account_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    # Update booking paid amount
    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    if booking:
        booking.paid_amount = (booking.paid_amount or 0) - payment.amount

    # Delete file if exists
    if payment.receipt_file_path and os.path.exists(payment.receipt_file_path):
        os.remove(payment.receipt_file_path)

    db.delete(payment)
    db.commit()

    return None


@router.post("/{payment_id}/upload-receipt", response_model=PaymentResponse)
async def upload_payment_receipt(
    payment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a receipt for a payment."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.account_id == current_user.account_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    # Check file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )

    # Create upload directory
    upload_dir = os.path.join(settings.UPLOAD_DIR, "receipts")
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

    # Delete old receipt if exists
    if payment.receipt_file_path and os.path.exists(payment.receipt_file_path):
        os.remove(payment.receipt_file_path)

    # Update payment
    payment.receipt_file_path = file_path

    db.commit()
    db.refresh(payment)

    return payment
