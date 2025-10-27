import os
import logging
from typing import Optional
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from jinja2 import Template
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.booking import Booking

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        # Email configuration
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from = os.getenv("SMTP_FROM", self.smtp_user)

        # SMS configuration (Twilio)
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER", "")

        # Initialize Twilio client if credentials are available
        self.twilio_client = None
        if self.twilio_account_sid and self.twilio_auth_token:
            try:
                from twilio.rest import Client
                self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
            except Exception as e:
                logger.warning(f"Failed to initialize Twilio client: {e}")

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        db: Session,
        account_id: str,
        booking_id: Optional[int] = None
    ) -> Notification:
        """Send an email notification"""
        # Create notification record
        notification = Notification(
            notification_type=NotificationType.EMAIL,
            recipient=to_email,
            subject=subject,
            message=body,
            booking_id=booking_id,
            account_id=account_id,
            status=NotificationStatus.PENDING
        )
        db.add(notification)
        db.commit()

        try:
            # Create message
            message = MIMEMultipart()
            message["From"] = self.smtp_from
            message["To"] = to_email
            message["Subject"] = subject
            message.attach(MIMEText(body, "html"))

            # Send email
            if self.smtp_user and self.smtp_password:
                await aiosmtplib.send(
                    message,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_user,
                    password=self.smtp_password,
                    start_tls=True
                )

                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                logger.info(f"Email sent to {to_email}")
            else:
                # If SMTP is not configured, just log
                logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            notification.status = NotificationStatus.FAILED
            notification.error_message = str(e)

        db.commit()
        db.refresh(notification)
        return notification

    async def send_sms(
        self,
        to_phone: str,
        message: str,
        db: Session,
        account_id: str,
        booking_id: Optional[int] = None
    ) -> Notification:
        """Send an SMS notification"""
        # Create notification record
        notification = Notification(
            notification_type=NotificationType.SMS,
            recipient=to_phone,
            message=message,
            booking_id=booking_id,
            account_id=account_id,
            status=NotificationStatus.PENDING
        )
        db.add(notification)
        db.commit()

        try:
            if self.twilio_client and self.twilio_from_number:
                # Send SMS via Twilio
                message_obj = self.twilio_client.messages.create(
                    body=message,
                    from_=self.twilio_from_number,
                    to=to_phone
                )

                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                logger.info(f"SMS sent to {to_phone}, SID: {message_obj.sid}")
            else:
                # If Twilio is not configured, just log
                logger.warning(f"Twilio not configured. Would send SMS to {to_phone}: {message}")
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()

        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {e}")
            notification.status = NotificationStatus.FAILED
            notification.error_message = str(e)

        db.commit()
        db.refresh(notification)
        return notification

    async def send_booking_notification(
        self,
        booking_id: int,
        notification_type: NotificationType,
        template_name: str,
        db: Session,
        account_id: str
    ) -> Optional[Notification]:
        """Send a booking-related notification using a template"""
        # Get booking details
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            logger.error(f"Booking {booking_id} not found")
            return None

        # Generate message based on template
        context = {
            "booking_number": booking.booking_number,
            "customer_name": booking.customer.full_name,
            "tour_rep_name": booking.tour_rep.full_name,
            "start_date": booking.start_date.strftime("%B %d, %Y"),
            "end_date": booking.end_date.strftime("%B %d, %Y"),
            "total_amount": f"LKR {booking.total_amount:,.2f}" if booking.total_amount else "N/A",
            "paid_amount": f"LKR {booking.paid_amount:,.2f}",
            "outstanding": f"LKR {(booking.total_amount or 0) - booking.paid_amount:,.2f}",
            "status": booking.status.upper()
        }

        message_body = self._get_template_message(template_name, context)

        if notification_type == NotificationType.EMAIL:
            if not booking.customer.email:
                logger.warning(f"Customer {booking.customer.full_name} has no email")
                return None

            subject = self._get_template_subject(template_name, context)
            return await self.send_email(
                to_email=booking.customer.email,
                subject=subject,
                body=message_body,
                db=db,
                account_id=account_id,
                booking_id=booking_id
            )

        elif notification_type == NotificationType.SMS:
            if not booking.customer.phone:
                logger.warning(f"Customer {booking.customer.full_name} has no phone")
                return None

            # For SMS, use a shorter plain text version
            sms_body = self._get_sms_message(template_name, context)
            return await self.send_sms(
                to_phone=booking.customer.phone,
                message=sms_body,
                db=db,
                account_id=account_id,
                booking_id=booking_id
            )

        return None

    def _get_template_subject(self, template_name: str, context: dict) -> str:
        """Get email subject based on template"""
        subjects = {
            "booking_confirmation": f"Booking Confirmation - {context['booking_number']}",
            "booking_reminder": f"Booking Reminder - {context['booking_number']}",
            "payment_reminder": f"Payment Reminder - {context['booking_number']}",
            "booking_cancelled": f"Booking Cancelled - {context['booking_number']}",
            "booking_completed": f"Booking Completed - {context['booking_number']}"
        }
        return subjects.get(template_name, f"Notification - {context['booking_number']}")

    def _get_template_message(self, template_name: str, context: dict) -> str:
        """Get email message body based on template"""
        templates = {
            "booking_confirmation": """
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">Booking Confirmation</h2>
                    <p>Dear {customer_name},</p>
                    <p>Your booking has been confirmed!</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Booking Number:</strong> {booking_number}</p>
                        <p><strong>Tour Representative:</strong> {tour_rep_name}</p>
                        <p><strong>Dates:</strong> {start_date} to {end_date}</p>
                        <p><strong>Total Amount:</strong> {total_amount}</p>
                        <p><strong>Paid:</strong> {paid_amount}</p>
                        <p><strong>Outstanding:</strong> {outstanding}</p>
                        <p><strong>Status:</strong> {status}</p>
                    </div>
                    <p>Thank you for choosing our services!</p>
                    <p>Best regards,<br>Nilu Tourism</p>
                </body>
                </html>
            """,
            "payment_reminder": """
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #dc2626;">Payment Reminder</h2>
                    <p>Dear {customer_name},</p>
                    <p>This is a friendly reminder about your outstanding payment.</p>
                    <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Booking Number:</strong> {booking_number}</p>
                        <p><strong>Total Amount:</strong> {total_amount}</p>
                        <p><strong>Paid:</strong> {paid_amount}</p>
                        <p><strong>Outstanding Balance:</strong> {outstanding}</p>
                    </div>
                    <p>Please arrange payment at your earliest convenience.</p>
                    <p>Best regards,<br>Nilu Tourism</p>
                </body>
                </html>
            """,
            "booking_reminder": """
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">Booking Reminder</h2>
                    <p>Dear {customer_name},</p>
                    <p>This is a reminder about your upcoming tour!</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Booking Number:</strong> {booking_number}</p>
                        <p><strong>Tour Representative:</strong> {tour_rep_name}</p>
                        <p><strong>Start Date:</strong> {start_date}</p>
                    </div>
                    <p>We look forward to serving you!</p>
                    <p>Best regards,<br>Nilu Tourism</p>
                </body>
                </html>
            """
        }

        template_str = templates.get(template_name, """
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Booking Notification</h2>
                <p>Dear {customer_name},</p>
                <p>Booking Number: {booking_number}</p>
                <p>Status: {status}</p>
                <p>Best regards,<br>Nilu Tourism</p>
            </body>
            </html>
        """)

        template = Template(template_str)
        return template.render(**context)

    def _get_sms_message(self, template_name: str, context: dict) -> str:
        """Get SMS message based on template"""
        templates = {
            "booking_confirmation": f"Your booking {context['booking_number']} has been confirmed! Tour dates: {context['start_date']} to {context['end_date']}. Total: {context['total_amount']}. - Nilu Tourism",
            "payment_reminder": f"Payment reminder for booking {context['booking_number']}. Outstanding: {context['outstanding']}. Please arrange payment. - Nilu Tourism",
            "booking_reminder": f"Reminder: Your tour {context['booking_number']} starts on {context['start_date']}. Tour Rep: {context['tour_rep_name']}. - Nilu Tourism"
        }

        return templates.get(template_name, f"Notification for booking {context['booking_number']} - Nilu Tourism")


# Global instance
notification_service = NotificationService()
