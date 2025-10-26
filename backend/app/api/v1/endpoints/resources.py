from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission
from app.models.user import User
from app.models.resource import Car, Driver, TourRep
from app.schemas.resource import (
    CarCreate, CarUpdate, CarResponse,
    DriverCreate, DriverUpdate, DriverResponse,
    TourRepCreate, TourRepUpdate, TourRepResponse
)

router = APIRouter()


# Car Endpoints
@router.get("/cars", response_model=List[CarResponse])
def list_cars(
    skip: int = 0,
    limit: int = 100,
    available_only: bool = Query(False, description="Show only available cars"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all cars."""
    query = db.query(Car).filter(Car.account_id == current_user.account_id)

    if available_only:
        query = query.filter(Car.is_available == True)

    cars = query.offset(skip).limit(limit).all()
    return cars


@router.post("/cars", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
def create_car(
    car_data: CarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Create a new car."""
    # Check if registration number already exists
    existing = db.query(Car).filter(
        Car.registration_number == car_data.registration_number,
        Car.account_id == current_user.account_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Car with this registration number already exists"
        )

    car = Car(**car_data.dict(), account_id=current_user.account_id)
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@router.get("/cars/{car_id}", response_model=CarResponse)
def get_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get car by ID."""
    car = db.query(Car).filter(
        Car.id == car_id,
        Car.account_id == current_user.account_id
    ).first()

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )

    return car


@router.put("/cars/{car_id}", response_model=CarResponse)
def update_car(
    car_id: int,
    car_data: CarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Update car."""
    car = db.query(Car).filter(
        Car.id == car_id,
        Car.account_id == current_user.account_id
    ).first()

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )

    update_data = car_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(car, field, value)

    db.commit()
    db.refresh(car)

    return car


@router.delete("/cars/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Delete car."""
    car = db.query(Car).filter(
        Car.id == car_id,
        Car.account_id == current_user.account_id
    ).first()

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )

    db.delete(car)
    db.commit()

    return None


# Driver Endpoints
@router.get("/drivers", response_model=List[DriverResponse])
def list_drivers(
    skip: int = 0,
    limit: int = 100,
    available_only: bool = Query(False, description="Show only available drivers"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all drivers."""
    query = db.query(Driver).filter(Driver.account_id == current_user.account_id)

    if available_only:
        query = query.filter(Driver.is_available == True)

    drivers = query.offset(skip).limit(limit).all()
    return drivers


@router.post("/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(
    driver_data: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Create a new driver."""
    # Check if license number already exists
    existing = db.query(Driver).filter(
        Driver.license_number == driver_data.license_number,
        Driver.account_id == current_user.account_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver with this license number already exists"
        )

    driver = Driver(**driver_data.dict(), account_id=current_user.account_id)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get driver by ID."""
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.account_id == current_user.account_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    return driver


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    driver_data: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Update driver."""
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.account_id == current_user.account_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    update_data = driver_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)

    return driver


@router.delete("/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Delete driver."""
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.account_id == current_user.account_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    db.delete(driver)
    db.commit()

    return None


# Tour Rep Endpoints
@router.get("/tour-reps", response_model=List[TourRepResponse])
def list_tour_reps(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = Query(False, description="Show only active tour reps"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all tour reps."""
    query = db.query(TourRep).filter(TourRep.account_id == current_user.account_id)

    if active_only:
        query = query.filter(TourRep.is_active == True)

    tour_reps = query.offset(skip).limit(limit).all()
    return tour_reps


@router.post("/tour-reps", response_model=TourRepResponse, status_code=status.HTTP_201_CREATED)
def create_tour_rep(
    tour_rep_data: TourRepCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Create a new tour rep."""
    tour_rep = TourRep(**tour_rep_data.dict(), account_id=current_user.account_id)
    db.add(tour_rep)
    db.commit()
    db.refresh(tour_rep)
    return tour_rep


@router.get("/tour-reps/{tour_rep_id}", response_model=TourRepResponse)
def get_tour_rep(
    tour_rep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tour rep by ID."""
    tour_rep = db.query(TourRep).filter(
        TourRep.id == tour_rep_id,
        TourRep.account_id == current_user.account_id
    ).first()

    if not tour_rep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour rep not found"
        )

    return tour_rep


@router.put("/tour-reps/{tour_rep_id}", response_model=TourRepResponse)
def update_tour_rep(
    tour_rep_id: int,
    tour_rep_data: TourRepUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Update tour rep."""
    tour_rep = db.query(TourRep).filter(
        TourRep.id == tour_rep_id,
        TourRep.account_id == current_user.account_id
    ).first()

    if not tour_rep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour rep not found"
        )

    update_data = tour_rep_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tour_rep, field, value)

    db.commit()
    db.refresh(tour_rep)

    return tour_rep


@router.delete("/tour-reps/{tour_rep_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour_rep(
    tour_rep_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_resources"))
):
    """Delete tour rep."""
    tour_rep = db.query(TourRep).filter(
        TourRep.id == tour_rep_id,
        TourRep.account_id == current_user.account_id
    ).first()

    if not tour_rep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour rep not found"
        )

    db.delete(tour_rep)
    db.commit()

    return None
