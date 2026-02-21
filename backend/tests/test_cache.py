import time

from app.utils.cache import TTLCache


def test_set_and_get():
    cache = TTLCache(ttl_seconds=10)
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1"


def test_get_missing_key():
    cache = TTLCache(ttl_seconds=10)
    assert cache.get("nonexistent") is None


def test_expired_entry():
    cache = TTLCache(ttl_seconds=0)
    cache.set("key1", "value1")
    time.sleep(0.01)
    assert cache.get("key1") is None


def test_clear():
    cache = TTLCache(ttl_seconds=10)
    cache.set("k1", "v1")
    cache.set("k2", "v2")
    cache.clear()
    assert cache.get("k1") is None
    assert cache.get("k2") is None


def test_max_size():
    cache = TTLCache(ttl_seconds=10, max_size=2)
    cache.set("k1", "v1")
    cache.set("k2", "v2")
    cache.set("k3", "v3")  # should evict oldest
    assert cache.get("k3") == "v3"
