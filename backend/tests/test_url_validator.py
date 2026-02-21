from app.utils.url_validator import validate_video_url


# --- X / Twitter ---

def test_valid_x_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://x.com/elonmusk/status/1234567890"
    )
    assert is_valid is True
    assert url == "https://x.com/elonmusk/status/1234567890"
    assert external_id == "1234567890"
    assert platform == "x"


def test_valid_twitter_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://twitter.com/user123/status/9876543210"
    )
    assert is_valid is True
    assert url == "https://x.com/user123/status/9876543210"
    assert external_id == "9876543210"
    assert platform == "x"


def test_url_with_query_params():
    is_valid, url, external_id, platform = validate_video_url(
        "https://x.com/user/status/123456?s=20&t=abc"
    )
    assert is_valid is True
    assert url == "https://x.com/user/status/123456"
    assert external_id == "123456"


def test_url_with_www():
    is_valid, url, external_id, platform = validate_video_url(
        "https://www.twitter.com/user/status/111222333"
    )
    assert is_valid is True
    assert url == "https://x.com/user/status/111222333"


def test_invalid_url_no_status():
    is_valid, url, external_id, platform = validate_video_url("https://x.com/user")
    assert is_valid is False
    assert url is None
    assert external_id is None


def test_invalid_url_wrong_domain():
    is_valid, url, external_id, platform = validate_video_url(
        "https://facebook.com/user/status/123"
    )
    assert is_valid is False


def test_invalid_url_empty():
    is_valid, url, external_id, platform = validate_video_url("")
    assert is_valid is False


def test_url_with_whitespace():
    is_valid, url, external_id, platform = validate_video_url(
        "  https://x.com/user/status/123456  "
    )
    assert is_valid is True
    assert external_id == "123456"


def test_http_url():
    is_valid, url, external_id, platform = validate_video_url(
        "http://x.com/user/status/123456"
    )
    assert is_valid is True
    assert url == "https://x.com/user/status/123456"


# --- YouTube ---

def test_youtube_watch_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    )
    assert is_valid is True
    assert url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert external_id == "dQw4w9WgXcQ"
    assert platform == "youtube"


def test_youtube_short_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://youtu.be/dQw4w9WgXcQ"
    )
    assert is_valid is True
    assert url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert external_id == "dQw4w9WgXcQ"
    assert platform == "youtube"


def test_youtube_shorts_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://youtube.com/shorts/abc123XYZ_-"
    )
    assert is_valid is True
    assert url == "https://www.youtube.com/watch?v=abc123XYZ_-"
    assert external_id == "abc123XYZ_-"
    assert platform == "youtube"


def test_youtube_mobile_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ"
    )
    assert is_valid is True
    assert external_id == "dQw4w9WgXcQ"
    assert platform == "youtube"


# --- TikTok ---

def test_tiktok_video_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://www.tiktok.com/@username/video/1234567890123456789"
    )
    assert is_valid is True
    assert external_id == "1234567890123456789"
    assert platform == "tiktok"


def test_tiktok_short_url():
    is_valid, url, external_id, platform = validate_video_url(
        "https://vm.tiktok.com/ZMdAbCdEf/"
    )
    assert is_valid is True
    assert platform == "tiktok"
