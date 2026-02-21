import re
from urllib.parse import urlparse

TWEET_URL_PATTERN = re.compile(
    r"^https?://(www\.)?(twitter\.com|x\.com)/(\w+)/status/(\d+)"
)


def validate_tweet_url(url: str) -> tuple[bool, str | None, str | None]:
    """
    Validate and normalize an X/Twitter tweet URL.

    Returns:
        (is_valid, normalized_url, tweet_id)
    """
    url = url.strip()

    # Remove query params and fragments
    parsed = urlparse(url)
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    match = TWEET_URL_PATTERN.match(clean_url)
    if not match:
        return False, None, None

    username = match.group(3)
    tweet_id = match.group(4)

    # Normalize to x.com format
    normalized = f"https://x.com/{username}/status/{tweet_id}"
    return True, normalized, tweet_id
