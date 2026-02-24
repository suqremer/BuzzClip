import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def send_discord_alert(content: str) -> None:
    """Send a message to the configured Discord webhook. Silently fails."""
    url = settings.discord_webhook_url
    if not url:
        return
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(url, json={"content": content})
    except Exception:
        logger.warning("Failed to send Discord webhook", exc_info=True)


async def alert_mass_posting(user_display_name: str, user_id: str, post_count: int) -> None:
    """Alert admins when a user exceeds the mass posting threshold."""
    await send_discord_alert(
        f"⚠️ **大量投稿アラート**\n"
        f"ユーザー **{user_display_name}** (ID: {user_id}) が"
        f"24時間以内に **{post_count}件** 投稿しています。"
    )
