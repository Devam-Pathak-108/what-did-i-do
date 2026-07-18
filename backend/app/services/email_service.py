import logging

import aiosmtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)


async def send_otp_email(to_email: str, otp: str) -> None:
    settings = get_settings()
    subject = f"{settings.app_name} — Your verification code"
    body = (
        f"Your verification code is: {otp}\n\n"
        f"This code expires in {settings.otp_expire_minutes} minutes.\n"
        "If you did not request this, you can ignore this email."
    )

    if not settings.smtp_username or not settings.smtp_password:
        # Dev fallback so local development works without SMTP credentials.
        logger.warning(
            "SMTP credentials not configured. OTP for %s: %s",
            to_email,
            otp,
        )
        return

    message = EmailMessage()
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        start_tls=settings.smtp_use_tls,
    )
