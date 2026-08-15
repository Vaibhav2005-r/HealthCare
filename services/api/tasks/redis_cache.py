import os
import json
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_URL")

async def get_redis_client():
    url = UPSTASH_REDIS_URL
    if url and url.startswith("redis://") and "upstash.io" in url:
        url = url.replace("redis://", "rediss://", 1)
    return redis.from_url(url)

async def cache_dashboard_payload(payload: dict):
    """
    Write computed payload to Redis with short TTL.
    """
    try:
        client = await get_redis_client()
        # Cache for 6 hours
        await client.set("dashboard_payload", json.dumps(payload), ex=21600)
        await client.aclose()
        print("Dashboard payload cached successfully in Upstash Redis.")
    except Exception as e:
        print(f"Error caching to Redis: {e}")

