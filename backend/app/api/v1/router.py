from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    customers,
    resources,
    templates,
    bookings,
    payments,
    dashboard
)

api_router = APIRouter()

# Auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# User management
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Customer management
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])

# Resource management (cars, drivers, tour reps)
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])

# Template management
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])

# Booking management
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])

# Payment management
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

# Dashboard & Analytics
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
