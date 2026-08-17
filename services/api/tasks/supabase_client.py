import os
import asyncpg
import datetime
from dotenv import load_dotenv
from typing import Dict, Any, List

load_dotenv()
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

async def fetch_new_case_reports(since: datetime.datetime = None) -> List[dict]:
    """
    Fetches case reports from Supabase that were reported after the `since` timestamp.
    If `since` is None, fetches the last 7 days by default.
    """
    if not DATABASE_URL:
        return []

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        if since is None:
            since = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)

        query = """
        SELECT id::text, patient_age_years, patient_gender, district, symptoms, suspected_disease, 
               severity, reported_at, notes, latitude, longitude
        FROM case_reports
        WHERE reported_at >= $1
        ORDER BY reported_at ASC;
        """
        
        records = await conn.fetch(query, since)
        await conn.close()
        
        return [dict(record) for record in records]
    except Exception as e:
        print(f"[Supabase Client] Error fetching case reports: {e}")
        return []

async def update_district_risk_scores(forecasts: Dict[str, Any]):
    """
    Updates the risk scores and risk levels in the Supabase `districts` table based on ML inference.
    """
    if not DATABASE_URL or not forecasts:
        return

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        for district_name, data in forecasts.items():
            risk_score = data.get("risk_score", 0.2)
            label = data.get("label", "LOW")
            
            await conn.execute("""
                UPDATE districts
                SET risk_score = $1, risk_level = $2, last_reported = 'Updated by Outbreak LSTM'
                WHERE name = $3;
            """, risk_score, label, district_name)
            
        await conn.close()
        print(f"[Supabase Client] Successfully updated {len(forecasts)} district risk scores in Supabase.")
    except Exception as e:
        print(f"[Supabase Client] Error updating district risk scores: {e}")
