import httpx

from app.utils.cache import TTLCache

OEMBED_ENDPOINT = "https://publish.x.com/oembed"

oembed_cache = TTLCache(ttl_seconds=3600, max_size=1000)


async def fetch_oembed(tweet_url: str, lang: str = "ja") -> dict | None:
    """
    Fetch oEmbed data from X.

    The oEmbed API is free and requires no authentication.
    Returns dict with keys: url, author_name, author_url, html, etc.
    Returns None on error.
    """
    cached = oembed_cache.get(tweet_url)
    if cached is not None:
        return cached

    params = {
        "url": tweet_url,
        "lang": lang,
        "omit_script": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(OEMBED_ENDPOINT, params=params)
            if resp.status_code == 200:
                data = resp.json()
                oembed_cache.set(tweet_url, data)
                return data
    except httpx.RequestError:
        pass

    return None
