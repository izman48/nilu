from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.resource import Car, Driver, TourRep
from app.models.customer import Customer
from app.models.payment import Payment

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    start_date: Optional[datetime] = Query(None, description="Filter from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter until this date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_view_analytics"))
):
    """Get dashboard statistics."""
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()

    account_filter = Booking.account_id == current_user.account_id
    date_filter = and_(
        Booking.start_date >= start_date,
        Booking.start_date <= end_date
    )

    # Total bookings
    total_bookings = db.query(func.count(Booking.id)).filter(
        account_filter, date_filter
    ).scalar()

    # Bookings by status
    bookings_by_status = {}
    for status in BookingStatus:
        count = db.query(func.count(Booking.id)).filter(
            account_filter,
            date_filter,
            Booking.status == status
        ).scalar()
        bookings_by_status[status.value] = count

    # Revenue stats
    total_revenue = db.query(func.sum(Booking.total_amount)).filter(
        account_filter, date_filter
    ).scalar() or 0

    total_paid = db.query(func.sum(Booking.paid_amount)).filter(
        account_filter, date_filter
    ).scalar() or 0

    total_outstanding = total_revenue - total_paid

    # Top performing tour reps
    top_tour_reps = db.query(
        TourRep.id,
        TourRep.full_name,
        func.count(Booking.id).label("booking_count"),
        func.sum(Booking.total_amount).label("total_revenue")
    ).join(Booking, Booking.tour_rep_id == TourRep.id).filter(
        account_filter, date_filter
    ).group_by(TourRep.id, TourRep.full_name).order_by(
        func.count(Booking.id).desc()
    ).limit(10).all()

    top_tour_reps_data = [
        {
            "id": rep.id,
            "name": rep.full_name,
            "booking_count": rep.booking_count,
            "total_revenue": float(rep.total_revenue) if rep.total_revenue else 0
        }
        for rep in top_tour_reps
    ]

    # Most used cars
    top_cars = db.query(
        Car.id,
        Car.registration_number,
        Car.make,
        Car.model,
        func.count(Booking.id).label("booking_count")
    ).join(Booking, Booking.car_id == Car.id).filter(
        account_filter, date_filter, Booking.car_id.isnot(None)
    ).group_by(Car.id, Car.registration_number, Car.make, Car.model).order_by(
        func.count(Booking.id).desc()
    ).limit(10).all()

    top_cars_data = [
        {
            "id": car.id,
            "registration_number": car.registration_number,
            "name": f"{car.make} {car.model}",
            "booking_count": car.booking_count
        }
        for car in top_cars
    ]

    # Most used drivers
    top_drivers = db.query(
        Driver.id,
        Driver.full_name,
        func.count(Booking.id).label("booking_count")
    ).join(Booking, Booking.driver_id == Driver.id).filter(
        account_filter, date_filter, Booking.driver_id.isnot(None)
    ).group_by(Driver.id, Driver.full_name).order_by(
        func.count(Booking.id).desc()
    ).limit(10).all()

    top_drivers_data = [
        {
            "id": driver.id,
            "name": driver.full_name,
            "booking_count": driver.booking_count
        }
        for driver in top_drivers
    ]

    # Resource availability
    total_cars = db.query(func.count(Car.id)).filter(
        Car.account_id == current_user.account_id
    ).scalar()
    available_cars = db.query(func.count(Car.id)).filter(
        Car.account_id == current_user.account_id,
        Car.is_available == True
    ).scalar()

    total_drivers = db.query(func.count(Driver.id)).filter(
        Driver.account_id == current_user.account_id
    ).scalar()
    available_drivers = db.query(func.count(Driver.id)).filter(
        Driver.account_id == current_user.account_id,
        Driver.is_available == True
    ).scalar()

    # Recent bookings
    recent_bookings = db.query(Booking).filter(
        account_filter
    ).order_by(Booking.created_at.desc()).limit(10).all()

    recent_bookings_data = [
        {
            "id": booking.id,
            "booking_number": booking.booking_number,
            "customer_name": booking.customer.full_name if booking.customer else None,
            "tour_rep_name": booking.tour_rep.full_name if booking.tour_rep else None,
            "status": booking.status.value,
            "start_date": booking.start_date,
            "total_amount": float(booking.total_amount) if booking.total_amount else 0
        }
        for booking in recent_bookings
    ]

    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "bookings": {
            "total": total_bookings,
            "by_status": bookings_by_status
        },
        "revenue": {
            "total": float(total_revenue),
            "paid": float(total_paid),
            "outstanding": float(total_outstanding)
        },
        "top_performers": {
            "tour_reps": top_tour_reps_data,
            "cars": top_cars_data,
            "drivers": top_drivers_data
        },
        "resources": {
            "cars": {
                "total": total_cars,
                "available": available_cars
            },
            "drivers": {
                "total": total_drivers,
                "available": available_drivers
            }
        },
        "recent_bookings": recent_bookings_data
    }


@router.get("/tour-rep/{tour_rep_id}/stats")
def get_tour_rep_stats(
    tour_rep_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_view_analytics"))
):
    """Get statistics for a specific tour rep."""
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()

    # Verify tour rep exists
    tour_rep = db.query(TourRep).filter(
        TourRep.id == tour_rep_id,
        TourRep.account_id == current_user.account_id
    ).first()

    if not tour_rep:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour rep not found"
        )

    # Get bookings
    bookings = db.query(Booking).filter(
        Booking.tour_rep_id == tour_rep_id,
        Booking.account_id == current_user.account_id,
        Booking.start_date >= start_date,
        Booking.start_date <= end_date
    ).all()

    total_bookings = len(bookings)
    total_revenue = sum(float(b.total_amount) if b.total_amount else 0 for b in bookings)

    bookings_by_status = {}
    for status in BookingStatus:
        count = len([b for b in bookings if b.status == status])
        bookings_by_status[status.value] = count

    return {
        "tour_rep": {
            "id": tour_rep.id,
            "name": tour_rep.full_name,
            "phone": tour_rep.phone,
            "email": tour_rep.email
        },
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "stats": {
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "bookings_by_status": bookings_by_status
        }
    }
