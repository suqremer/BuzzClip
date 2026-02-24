from fastapi import Request
from slowapi import Limiter


def _get_real_ip(request: Request) -> str:
    """Extract the real client IP from X-Forwarded-For.

    Vercel (and most reverse proxies) set X-Forwarded-For to the original
    client IP.  Using request.client.host would return the proxy's IP,
    making all users share the same rate-limit bucket.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # "client, proxy1, proxy2" — first entry is the real client
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(key_func=_get_real_ip, default_limits=["60/minute"])
