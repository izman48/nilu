#!/usr/bin/env python3
"""
Database initialization script.
Creates initial admin user and sample data.
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.template import Template, TemplateField, FieldType
from app.models.resource import Car, Driver, TourRep
from app.models.customer import Customer


def init_db():
    """Initialize database with initial data."""
    db = SessionLocal()

    try:
        # Create tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)

        # Create Nilu company if it doesn't exist
        nilu_company = db.query(Company).filter(Company.account_id == "nilu").first()
        if not nilu_company:
            print("Creating Nilu company...")
            nilu_company = Company(
                name="Nilu Tourism",
                account_id="nilu",
                email="info@nilu.lk",
                phone="+94112345678",
                address="Colombo, Sri Lanka",
                is_active=True,
                plan_type="enterprise",
                max_users=50,
            )
            db.add(nilu_company)
            db.commit()
            db.refresh(nilu_company)
            print("Nilu company created")

        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("Creating admin user...")
            admin = User(
                username="admin",
                email="admin@nilu.lk",
                full_name="Admin User",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                company_id=nilu_company.id,
                account_id="nilu",
                can_create_bookings=True,
                can_edit_bookings=True,
                can_delete_bookings=True,
                can_manage_users=True,
                can_manage_templates=True,
                can_view_analytics=True,
                can_manage_resources=True,
            )
            db.add(admin)
            db.commit()
            print("Admin user created (username: admin, password: admin123)")
        elif not admin.company_id:
            # Update existing admin to be part of Nilu company
            print("Updating admin user to be part of Nilu company...")
            admin.company_id = nilu_company.id
            admin.account_id = "nilu"
            db.commit()
            print("Admin user updated")

        # Create sample templates if none exist
        template_count = db.query(Template).count()
        if template_count == 0:
            print("Creating sample templates...")

            # Rent a Car template
            rent_car_template = Template(
                name="Rent a Car",
                description="Car rental service without driver",
                icon="car",
                color="#3B82F6",
                is_active=True
            )
            db.add(rent_car_template)
            db.flush()

            # Add fields for Rent a Car
            fields = [
                TemplateField(
                    template_id=rent_car_template.id,
                    field_name="pickup_location",
                    field_label="Pickup Location",
                    field_type=FieldType.TEXT,
                    is_required=True,
                    order=1
                ),
                TemplateField(
                    template_id=rent_car_template.id,
                    field_name="dropoff_location",
                    field_label="Drop-off Location",
                    field_type=FieldType.TEXT,
                    is_required=True,
                    order=2
                ),
                TemplateField(
                    template_id=rent_car_template.id,
                    field_name="fuel_level",
                    field_label="Initial Fuel Level",
                    field_type=FieldType.DROPDOWN,
                    is_required=True,
                    options=["Empty", "1/4", "1/2", "3/4", "Full"],
                    order=3
                ),
                TemplateField(
                    template_id=rent_car_template.id,
                    field_name="odometer_start",
                    field_label="Starting Odometer Reading",
                    field_type=FieldType.NUMBER,
                    is_required=True,
                    order=4
                ),
            ]

            # Car + Driver template
            car_driver_template = Template(
                name="Car + Driver",
                description="Car rental with driver service",
                icon="car-side",
                color="#10B981",
                is_active=True
            )
            db.add(car_driver_template)
            db.flush()

            car_driver_fields = [
                TemplateField(
                    template_id=car_driver_template.id,
                    field_name="pickup_location",
                    field_label="Pickup Location",
                    field_type=FieldType.TEXT,
                    is_required=True,
                    order=1
                ),
                TemplateField(
                    template_id=car_driver_template.id,
                    field_name="destinations",
                    field_label="Destinations/Itinerary",
                    field_type=FieldType.TEXTAREA,
                    is_required=True,
                    order=2
                ),
            ]

            # Tour Package template
            tour_package_template = Template(
                name="Tour Package",
                description="Complete tour package with accommodation and activities",
                icon="map",
                color="#F59E0B",
                is_active=True
            )
            db.add(tour_package_template)
            db.flush()

            tour_package_fields = [
                TemplateField(
                    template_id=tour_package_template.id,
                    field_name="package_name",
                    field_label="Package Name",
                    field_type=FieldType.TEXT,
                    is_required=True,
                    order=1
                ),
                TemplateField(
                    template_id=tour_package_template.id,
                    field_name="destinations",
                    field_label="Destinations",
                    field_type=FieldType.TEXTAREA,
                    is_required=True,
                    order=2
                ),
                TemplateField(
                    template_id=tour_package_template.id,
                    field_name="accommodation",
                    field_label="Accommodation Details",
                    field_type=FieldType.TEXTAREA,
                    is_required=False,
                    order=3
                ),
                TemplateField(
                    template_id=tour_package_template.id,
                    field_name="activities",
                    field_label="Included Activities",
                    field_type=FieldType.TEXTAREA,
                    is_required=False,
                    order=4
                ),
            ]

            all_fields = fields + car_driver_fields + tour_package_fields
            for field in all_fields:
                db.add(field)

            db.commit()
            print("Sample templates created")

        # Create sample resources if none exist
        car_count = db.query(Car).count()
        if car_count == 0:
            print("Creating sample resources...")

            # Sample cars
            cars = [
                Car(
                    registration_number="CAR-001",
                    make="Toyota",
                    model="KDH Van",
                    year=2020,
                    color="White",
                    seating_capacity=14,
                    daily_rate=15000,
                    is_available=True
                ),
                Car(
                    registration_number="CAR-002",
                    make="Toyota",
                    model="Prius",
                    year=2019,
                    color="Silver",
                    seating_capacity=4,
                    daily_rate=8000,
                    is_available=True
                ),
            ]

            # Sample drivers
            drivers = [
                Driver(
                    full_name="Nuwan Silva",
                    phone="+94771234567",
                    email="nuwan@example.com",
                    license_number="LIC-001",
                    languages="English, Sinhala",
                    daily_rate=5000,
                    is_available=True
                ),
            ]

            # Sample tour reps
            tour_reps = [
                TourRep(
                    full_name="Saman Perera",
                    phone="+94777654321",
                    email="saman@example.com",
                    region="Colombo",
                    is_active=True
                ),
            ]

            # Sample customers
            customers = [
                Customer(
                    full_name="John Smith",
                    email="john.smith@example.com",
                    phone="+1234567890",
                    country="USA",
                    passport_number="US123456789"
                ),
            ]

            for item in cars + drivers + tour_reps + customers:
                db.add(item)

            db.commit()
            print("Sample resources created")

        print("\nDatabase initialization complete!")
        print("\nYou can now log in with:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nChange the admin password after first login!")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
