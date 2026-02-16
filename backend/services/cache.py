import json
import logging
from config import Config

logger = logging.getLogger(__name__)

_redis_client = None
_memory_cache: dict[str, tuple[float, object]] = {}


def _get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(Config.REDIS_URL, decode_responses=True)
            _redis_client.ping()
        except Exception:
            logger.warning("Redis unavailable, falling back to in-memory cache")
            _redis_client = False  # Mark as unavailable
    return _redis_client if _redis_client else None


def cache_get(key: str):
    """Get a value from cache (Redis or in-memory fallback)."""
    client = _get_redis()
    if client:
        try:
            val = client.get(key)
            return json.loads(val) if val else None
        except Exception:
            pass

    # In-memory fallback
    import time
    if key in _memory_cache:
        expiry, value = _memory_cache[key]
        if time.time() < expiry:
            return value
        del _memory_cache[key]
    return None


def cache_set(key: str, value, ttl: int = 60):
    """Set a value in cache with TTL."""
    client = _get_redis()
    if client:
        try:
            client.setex(key, ttl, json.dumps(value))
            return
        except Exception:
            pass

    # In-memory fallback
    import time
    _memory_cache[key] = (time.time() + ttl, value)


def cache_delete(key: str):
    """Delete a value from cache."""
    client = _get_redis()
    if client:
        try:
            client.delete(key)
            return
        except Exception:
            pass
    _memory_cache.pop(key, None)
