import logging
import httpx
from app.config import settings

logger = logging.getLogger("telegram_service")

def send_telegram_notification(
    name: str = "Anonymous",
    email: str = "Not provided",
    playlist_url: str = "",
    subject: str = "",
    note: str = ""
) -> bool:
    """
    Sends an instant alert to the admin's Telegram chat via Telegram Bot API.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        logger.warning("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured. Skipping alert.")
        return False

    message_text = (
        f"📚 <b>New Playlist Requested on StudyTube AI!</b>\n\n"
        f"👤 <b>Requester:</b> {name}\n"
        f"📧 <b>Email:</b> {email}\n"
        f"📖 <b>Subject / Course:</b> {subject}\n"
        f"🔗 <b>Playlist Link:</b>\n{playlist_url}\n"
    )

    if note and note.strip():
        message_text += f"\n💬 <b>Note:</b> {note.strip()}\n"

    telegram_url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(telegram_url, json=payload)
            if resp.status_code == 200:
                logger.info(f"✅ Telegram notification dispatched for playlist request '{subject}'")
                return True
            else:
                logger.error(f"Telegram API responded with {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
        return False
