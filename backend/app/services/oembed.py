import httpx

from app.utils.cache import TTLCache

OEMBED_ENDPOINTS = {
    "x": "https://publish.x.com/oembed",
    "youtube": "https://www.youtube.com/oembed",
    "tiktok": "https://www.tiktok.com/oembed",
}

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
                oembed_cache.set(url, data)
                return data
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError):
        pass

    return None
