import re
from urllib.parse import parse_qs, urlparse

TWEET_URL_PATTERN = re.compile(
    r"^https?://(www\.)?(twitter\.com|x\.com)/(\w+)/status/(\d+)"
)

YOUTUBE_PATTERNS = [
    re.compile(r"^https?://(www\.)?youtube\.com/watch"),
    re.compile(r"^https?://(www\.)?youtube\.com/shorts/([A-Za-z0-9_-]+)"),
    re.compile(r"^https?://youtu\.be/([A-Za-z0-9_-]+)"),
    re.compile(r"^https?://m\.youtube\.com/watch"),
]

TIKTOK_PATTERNS = [
    re.compile(r"^https?://(www\.)?tiktok\.com/@[\w.-]+/video/(\d+)"),
    re.compile(r"^https?://vm\.tiktok\.com/([A-Za-z0-9_-]+)"),
    re.compile(r"^https?://vt\.tiktok\.com/([A-Za-z0-9_-]+)"),
]


def validate_video_url(url: str) -> tuple[bool, str | None, str | None, str | None]:
    """
    Validate and normalize a video URL from X, YouTube, or TikTok.

    Returns:
        (is_valid, normalized_url, external_id, platform)
    """
    url = url.strip()
    parsed = urlparse(url)
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    # X / Twitter
    match = TWEET_URL_PATTERN.match(clean_url)
    if match:
        username = match.group(3)
        external_id = match.group(4)
        normalized = f"https://x.com/{username}/status/{external_id}"
        return True, normalized, external_id, "x"

    # YouTube
    for pattern in YOUTUBE_PATTERNS:
        match = pattern.match(url)
        if match:
            video_id = _extract_youtube_id(url, parsed, match)
            if video_id:
                normalized = f"https://www.youtube.com/watch?v={video_id}"
                return True, normalized, video_id, "youtube"

    # TikTok
    tiktok_match = TIKTOK_PATTERNS[0].match(clean_url)
    if tiktok_match:
        video_id = tiktok_match.group(2)
        normalized = clean_url if clean_url.startswith("https://") else f"https://{clean_url[7:]}"
        return True, normalized, video_id, "tiktok"

    # TikTok short URLs (vm.tiktok.com, vt.tiktok.com)
    for pattern in TIKTOK_PATTERNS[1:]:
        if pattern.match(clean_url):
            # Short URLs — use the path as external_id, normalize keeps original
            short_id = parsed.path.strip("/")
            normalized = f"https://{parsed.netloc}/{short_id}"
            return True, normalized, short_id, "tiktok"

    return False, None, None, None


def _extract_youtube_id(url: str, parsed, match) -> str | None:
    """Extract YouTube video ID from various URL formats."""
    # youtu.be/ID
    if "youtu.be" in parsed.netloc:
        return match.group(1)

    # youtube.com/shorts/ID
    if "/shorts/" in parsed.path:
        return match.group(2)

    # youtube.com/watch?v=ID
    qs = parse_qs(parsed.query)
    v = qs.get("v")
    if v:
        return v[0]

    return None
