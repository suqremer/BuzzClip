import bleach
import httpx

from app.utils.cache import TTLCache

OEMBED_ENDPOINTS = {
    "x": "https://publish.x.com/oembed",
    "youtube": "https://www.youtube.com/oembed",
    "tiktok": "https://www.tiktok.com/oembed",
}

# Whitelist for oEmbed HTML sanitization
_OEMBED_ALLOWED_TAGS = [
    "blockquote", "iframe", "a", "p", "span", "br", "img", "div",
]
_OEMBED_ALLOWED_ATTRS = {
    "iframe": ["src", "width", "height", "frameborder", "allowfullscreen", "title"],
    "blockquote": ["class", "data-tweet-id", "cite", "data-video-id"],
    "a": ["href", "class"],
    "img": ["src", "alt"],
    "div": ["class"],
    "span": ["class"],
}
_OEMBED_MAX_HTML_SIZE = 500_000  # 500KB limit on oEmbed HTML

oembed_cache = TTLCache(ttl_seconds=3600, max_size=1000)


async def fetch_oembed(url: str, platform: str = "x", lang: str = "ja") -> dict | None:
    """
    Fetch oEmbed data from X, YouTube, or TikTok.

    All oEmbed APIs are free and require no authentication.
    Returns dict with keys: url, author_name, author_url, html, etc.
    Returns None on error.
    """
    cached = oembed_cache.get(url)
    if cached is not None:
        return cached

    endpoint = OEMBED_ENDPOINTS.get(platform)
    if not endpoint:
        return None

    params: dict[str, str] = {"url": url, "format": "json"}

    if platform == "x":
        params["lang"] = lang
        params["omit_script"] = "true"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(endpoint, params=params)
            if resp.status_code == 200:
                data = resp.json()
                # Sanitize HTML field to prevent stored XSS
                if "html" in data and data["html"]:
                    raw_html = data["html"]
                    if len(raw_html) > _OEMBED_MAX_HTML_SIZE:
                        data["html"] = ""
                    else:
                        data["html"] = bleach.clean(
                            raw_html,
                            tags=_OEMBED_ALLOWED_TAGS,
                            attributes=_OEMBED_ALLOWED_ATTRS,
                            strip=True,
                        )
                oembed_cache.set(url, data)
                return data
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError):
        pass

    return None
