import os
import asyncpg
import datetime
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

async def fetch_new_case_reports(since: datetime.datetime = None):
    """
    Fetches case reports from Supabase that were reported after the `since` timestamp.
    If `since` is None, fetches the last 24 hours by default.
    """
    conn = await asyncpg.connect(DATABASE_URL)
    
    if since is None:
        since = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)

    query = """
    SELECT id, patient_age_years, patient_gender, district, symptoms, suspected_disease, 
           severity, reported_at, notes, latitude, longitude
    FROM case_reports
    WHERE reported_at > $1
    ORDER BY reported_at ASC;
    """
    
    records = await conn.fetch(query, since)
    await conn.close()
    
    return [dict(record) for record in records]
