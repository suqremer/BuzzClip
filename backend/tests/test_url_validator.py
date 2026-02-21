from app.utils.url_validator import validate_tweet_url


def test_valid_x_url():
    is_valid, url, tweet_id = validate_tweet_url(
        "https://x.com/elonmusk/status/1234567890"
    )
    assert is_valid is True
    assert url == "https://x.com/elonmusk/status/1234567890"
    assert tweet_id == "1234567890"


def test_valid_twitter_url():
    is_valid, url, tweet_id = validate_tweet_url(
        "https://twitter.com/user123/status/9876543210"
    )
    assert is_valid is True
    assert url == "https://x.com/user123/status/9876543210"
    assert tweet_id == "9876543210"


def test_url_with_query_params():
    is_valid, url, tweet_id = validate_tweet_url(
        "https://x.com/user/status/123456?s=20&t=abc"
    )
    assert is_valid is True
    assert url == "https://x.com/user/status/123456"
    assert tweet_id == "123456"


def test_url_with_www():
    is_valid, url, tweet_id = validate_tweet_url(
        "https://www.twitter.com/user/status/111222333"
    )
    assert is_valid is True
    assert url == "https://x.com/user/status/111222333"


def test_invalid_url_no_status():
    is_valid, url, tweet_id = validate_tweet_url("https://x.com/user")
    assert is_valid is False
    assert url is None
    assert tweet_id is None


def test_invalid_url_wrong_domain():
    is_valid, url, tweet_id = validate_tweet_url(
        "https://facebook.com/user/status/123"
    )
    assert is_valid is False


def test_invalid_url_empty():
    is_valid, url, tweet_id = validate_tweet_url("")
    assert is_valid is False


def test_url_with_whitespace():
    is_valid, url, tweet_id = validate_tweet_url(
        "  https://x.com/user/status/123456  "
    )
    assert is_valid is True
    assert tweet_id == "123456"


def test_http_url():
    is_valid, url, tweet_id = validate_tweet_url(
        "http://x.com/user/status/123456"
    )
    assert is_valid is True
    assert url == "https://x.com/user/status/123456"
