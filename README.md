# Nilu - Tourism Management Platform

A comprehensive SaaS platform for managing tourism operations in Sri Lanka, including tours, car rentals, drivers, customers, and payments.

## Features

### Core Functionality
- **User Authentication & Authorization**: Role-based access control with granular permissions
- **Template System**: Flexible booking templates (Rent a Car, Tour Package, Car + Driver, etc.)
- **Booking Management**: Create, edit, and track bookings with dynamic forms based on templates
- **Customer Management**: CRM functionality to manage customer information
- **Resource Management**: Manage cars, drivers, and tour representatives
- **Payment Tracking**: Record and track payments with receipt uploads
- **Analytics Dashboard**: Real-time insights on bookings, revenue, and resource utilization
- **File Uploads**: Photo uploads for rental inspections and payment receipts

### User Roles & Permissions
- **Admin**: Full system access
- **Manager**: Manage bookings, resources, and view analytics
- **Agent**: Create and edit bookings
- **Viewer**: Read-only access

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Relational database
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **JWT**: Token-based authentication
- **Pydantic**: Data validation

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS
- **React Router**: Client-side routing
- **Zustand**: State management
- **Axios**: HTTP client

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **PostgreSQL 15**: Production database

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nilu
```

2. **Start the application with Docker Compose**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- FastAPI backend on port 8000
- React frontend on port 5173

3. **Initialize the database** (first time only)
```bash
docker-compose exec backend python init_db.py
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Credentials
```
Username: admin
Password: admin123
```

**⚠️ Important**: Change the admin password after first login!

## Project Structure

```
nilu/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core configurations
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── main.py        # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   └── init_db.py         # Database initialization
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── Dockerfile.dev
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Development

### Backend Development

Run backend in development mode with hot reload:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

Run frontend in development mode:
```bash
cd frontend
npm install
npm run dev
```

### Database Management

**Run migrations**:
```bash
docker-compose exec backend alembic upgrade head
```

**Create a new migration**:
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

**Reset database**:
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python init_db.py
```

## API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get access token
- `POST /api/v1/auth/login-json` - Login with JSON payload

### Resource Endpoints
- `/api/v1/users` - User management
- `/api/v1/customers` - Customer management
- `/api/v1/resources/cars` - Car management
- `/api/v1/resources/drivers` - Driver management
- `/api/v1/resources/tour-reps` - Tour rep management
- `/api/v1/templates` - Template management
- `/api/v1/bookings` - Booking management
- `/api/v1/payments` - Payment management
- `/api/v1/dashboard` - Analytics and insights

Full API documentation available at: http://localhost:8000/docs

## Database Schema

### Core Tables
- **users**: User accounts with role-based permissions
- **customers**: Customer information
- **cars**: Vehicle inventory
- **drivers**: Driver information
- **tour_reps**: Tour representative information
- **templates**: Booking templates with dynamic fields
- **template_fields**: Template field definitions
- **bookings**: Main booking records
- **booking_field_values**: Dynamic field values for bookings
- **booking_photos**: Photo attachments for bookings
- **payments**: Payment records with receipt tracking

## Key Features Implementation

### Template System
Templates allow you to create different booking types with custom fields:
1. Go to Templates page
2. Create a new template (e.g., "Rent a Car")
3. Add custom fields (text, dates, dropdowns, file uploads)
4. Users select template when creating bookings
5. Form dynamically renders based on template fields

### Booking Workflow
1. Select template type
2. Choose/create customer
3. Assign tour representative
4. Select resources (car, driver if applicable)
5. Fill template-specific fields
6. Set dates and pricing
7. Upload photos (for rentals)
8. Track payments

### Dashboard Analytics
- Total bookings and revenue
- Bookings by status
- Outstanding payments
- Resource availability
- Top performing tour reps
- Most utilized cars and drivers

## Deployment

### Production Deployment (Netlify Frontend)

**Backend** (Railway, Render, or similar):
1. Update environment variables
2. Change SECRET_KEY to a secure random value
3. Update BACKEND_CORS_ORIGINS
4. Deploy using Docker or direct Python deployment

**Frontend** (Netlify):
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `dist` folder to Netlify
3. Set environment variable: `VITE_API_URL=<your-backend-url>`
4. Configure redirects for SPA routing

### Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=<generate-secure-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
```

**Frontend (.env)**:
```env
VITE_API_URL=https://your-backend-url.com
```

## Security Considerations

1. **Change default admin password** immediately after setup
2. Use strong **SECRET_KEY** in production (generate with `openssl rand -hex 32`)
3. Enable HTTPS in production
4. Use environment-specific CORS origins
5. Regularly update dependencies
6. Implement rate limiting for API endpoints
7. Regular database backups

## Scaling for 100 Bookings/Day

The platform is designed to handle 100+ bookings per day:
- **PostgreSQL** efficiently handles this load
- **Indexed database queries** for fast lookups
- **Caching** can be added with Redis if needed
- **Database connection pooling** for concurrent requests
- **Horizontal scaling** possible with load balancers

## Future Enhancements

- [ ] Advanced booking creation form with dynamic templates
- [ ] Detailed booking edit functionality
- [ ] Customer and resource management UI
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] SMS integration for Sri Lankan mobile providers
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration
- [ ] Multi-language support (Sinhala, Tamil)
- [ ] Advanced reporting and exports
- [ ] Calendar view for bookings
- [ ] Real-time notifications
- [ ] Multi-tenancy for multiple agencies

## Support & Contributing

For issues, questions, or contributions:
1. Check existing issues
2. Create detailed bug reports
3. Submit pull requests with clear descriptions

## License

Proprietary - All rights reserved

## Contact

For inquiries about the Nilu Tourism Platform, please contact the development team.

---

**Made with ❤️ for Sri Lankan Tourism Industry**