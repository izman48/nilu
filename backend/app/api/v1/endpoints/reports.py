from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.reports import report_service

router = APIRouter()


@router.get("/bookings/excel")
def generate_bookings_excel_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Booking status filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Excel report for bookings"""
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    excel_data = report_service.generate_bookings_excel(
        db=db,
        account_id=current_user.account_id,
        start_date=start_dt,
        end_date=end_dt,
        status=status
    )

    filename = f"bookings_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/bookings/pdf")
def generate_bookings_pdf_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Booking status filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate PDF report for bookings"""
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    pdf_data = report_service.generate_bookings_pdf(
        db=db,
        account_id=current_user.account_id,
        start_date=start_dt,
        end_date=end_dt,
        status=status
    )

    filename = f"bookings_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/revenue/excel")
def generate_revenue_excel_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Excel report for revenue by tour rep"""
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    excel_data = report_service.generate_revenue_excel(
        db=db,
        account_id=current_user.account_id,
        start_date=start_dt,
        end_date=end_dt
    )

    filename = f"revenue_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/payments/excel")
def generate_payments_excel_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Excel report for payments"""
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    excel_data = report_service.generate_payments_excel(
        db=db,
        account_id=current_user.account_id,
        start_date=start_dt,
        end_date=end_dt
    )

    filename = f"payments_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
