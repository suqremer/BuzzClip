"""BuzzClip auto-tweet script.

Posts one promotional tweet from tweets.json on a rotating schedule.
Designed to run via GitHub Actions cron (3x daily).
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import tweepy

BUZZCLIP_URL = "https://buzzclip.jp"
JST = timezone(timedelta(hours=9))

_REQUIRED_ENV_KEYS = [
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
]


def load_tweets() -> list[dict]:
    path = Path(__file__).parent / "tweets.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def pick_tweet(tweets: list[dict]) -> dict:
    """Pick a tweet based on current JST date and session number.

    session is passed as argv[1]: 0=morning, 1=lunch, 2=evening.
    Uses (day_of_year * 3 + session) % len(tweets) for rotation.
    """
    session = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    now = datetime.now(JST)
    day_of_year = now.timetuple().tm_yday
    index = (day_of_year * 3 + session) % len(tweets)
    return tweets[index]


def post_tweet(tweet: dict) -> None:
    # Validate all required env vars exist before using them
    missing = [k for k in _REQUIRED_ENV_KEYS if k not in os.environ]
    if missing:
        print(f"Error: Missing environment variables: {', '.join(missing)}")
        sys.exit(1)

    try:
        client = tweepy.Client(
            consumer_key=os.environ["X_API_KEY"],
            consumer_secret=os.environ["X_API_SECRET"],
            access_token=os.environ["X_ACCESS_TOKEN"],
            access_token_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
        )

        text = tweet["text"].replace("[URL]", BUZZCLIP_URL)
        response = client.create_tweet(text=text)
        tweet_id = response.data["id"]
        print(f"Posted tweet {tweet['id']}: https://x.com/i/status/{tweet_id}")
    except tweepy.TweepyException as e:
        # Log error type only — never log credential values
        print(f"Tweet failed: {type(e).__name__}")
        sys.exit(1)


def main() -> None:
    tweets = load_tweets()
    tweet = pick_tweet(tweets)
    now = datetime.now(JST)
    print(f"[{now.isoformat()}] Selected: {tweet['id']} ({tweet['category']})")
    post_tweet(tweet)


if __name__ == "__main__":
    main()
