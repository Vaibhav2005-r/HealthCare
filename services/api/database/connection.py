import os
import asyncpg
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")

_pool: Optional[asyncpg.Pool] = None

async def init_db_pool() -> Optional[asyncpg.Pool]:
    """
    Initializes a global asyncpg connection pool if SUPABASE_DB_URL is set.
    """
    global _pool
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url or "YOUR-PASSWORD" in db_url:
        print("[Database] SUPABASE_DB_URL not configured. Running in memory / offline mode.")
        return None

    try:
        print(f"[Database] Initializing connection pool...")
        # If pool already exists, close it first
        if _pool is not None:
            await _pool.close()
            
        _pool = await asyncpg.create_pool(
            dsn=db_url,
            min_size=2,
            max_size=10,
            max_inactive_connection_lifetime=300.0,
            command_timeout=30.0
        )
        print("[Database] Connection pool created successfully.")
        return _pool
    except Exception as e:
        print(f"[Database] Failed to connect to Supabase: {e}")
        _pool = None
        return None

async def close_db_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        print("[Database] Connection pool closed.")

async def get_db_pool() -> Optional[asyncpg.Pool]:
    global _pool
    if _pool is None:
        db_url = os.getenv("SUPABASE_DB_URL")
        if db_url and "YOUR-PASSWORD" not in db_url:
            await init_db_pool()
    return _pool
