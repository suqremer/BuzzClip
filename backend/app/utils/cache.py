import time
from typing import Any


class TTLCache:
    """Simple dict-based TTL cache."""

    def __init__(self, ttl_seconds: int = 3600, max_size: int = 1000):
        self._cache: dict[str, tuple[Any, float]] = {}
        self._ttl = ttl_seconds
        self._max_size = max_size

    def get(self, key: str) -> Any | None:
        if key in self._cache:
            value, expire_at = self._cache[key]
            if time.time() < expire_at:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        if len(self._cache) >= self._max_size:
            self._evict_expired()
            if len(self._cache) >= self._max_size:
                oldest_key = min(self._cache, key=lambda k: self._cache[k][1])
                del self._cache[oldest_key]
        self._cache[key] = (value, time.time() + self._ttl)

    def clear(self) -> None:
        self._cache.clear()

    def _evict_expired(self) -> None:
        now = time.time()
        expired = [k for k, (_, exp) in self._cache.items() if now >= exp]
        for k in expired:
            del self._cache[k]
