import os
import asyncpg
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
DB_URL = os.getenv("SUPABASE_DB_URL")

_pool: Optional[asyncpg.Pool] = None

async def get_db_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=DB_URL,
            min_size=2,
            max_size=10,
            command_timeout=30
        )
    return _pool

async def close_db_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

# --- DISTRICTS ---
async def fetch_districts_from_db(risk_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if risk_filter and risk_filter.upper() != "ALL":
            rows = await conn.fetch(
                "SELECT * FROM public.districts WHERE UPPER(risk_level) = $1 ORDER BY risk_score DESC",
                risk_filter.upper()
            )
        else:
            rows = await conn.fetch("SELECT * FROM public.districts ORDER BY risk_score DESC")
        return [dict(r) for r in rows]

async def update_district_in_db(
    district_id: str,
    rainfall_mm: float,
    humidity_pct: float,
    risk_score: float,
    risk_level: str,
    active_cases: int,
    last_reported: str = "Just now (Live)"
):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE public.districts
            SET rainfall_mm = $1,
                humidity_pct = $2,
                risk_score = $3,
                risk_level = $4,
                active_cases = $5,
                last_reported = $6
            WHERE district_id = $7
        """, rainfall_mm, humidity_pct, risk_score, risk_level, active_cases, last_reported, district_id)

# --- ALERTS ---
async def fetch_alerts_from_db(limit: int = 50) -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM public.alerts ORDER BY id DESC LIMIT $1",
            limit
        )
        alerts = []
        for r in rows:
            d = dict(r)
            if hasattr(d.get('timestamp'), 'isoformat'):
                d['timestamp'] = d['timestamp'].isoformat()
            alerts.append(d)
        return alerts

async def insert_alert_to_db(alert: Dict[str, Any]) -> Dict[str, Any]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Generate custom id if not provided
        if not alert.get("id"):
            count = await conn.fetchval("SELECT COUNT(*) FROM public.alerts")
            alert["id"] = f"alt-{(count or 0) + 1:02d}"
            
        await conn.execute("""
            INSERT INTO public.alerts (id, district, state, type, severity, risk_score, cases_count, worker_role, timestamp, summary, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
                district = EXCLUDED.district,
                severity = EXCLUDED.severity,
                risk_score = EXCLUDED.risk_score,
                cases_count = EXCLUDED.cases_count,
                status = EXCLUDED.status
        """, 
            alert.get("id"),
            alert.get("district", "Maharashtra HQ"),
            alert.get("state", "Maharashtra"),
            alert.get("type", "SOS_TRIGGER"),
            alert.get("severity", "CRITICAL"),
            float(alert.get("risk_score", 0.85)),
            int(alert.get("cases_count", 1)),
            alert.get("worker_role", "ASHA Lead"),
            str(alert.get("timestamp", "Just now")),
            alert.get("summary", "Emergency outbreak alert"),
            alert.get("status", "UNACKNOWLEDGED")
        )
        return alert

# --- CASE REPORTS ---
async def fetch_case_reports_from_db(limit: int = 50) -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM public.case_reports
            ORDER BY reported_at DESC
            LIMIT $1
        """, limit)
        reports = []
        for r in rows:
            d = dict(r)
            for k, v in d.items():
                if hasattr(v, 'isoformat'):
                    d[k] = v.isoformat()
            reports.append(d)
        return reports

async def insert_case_report_to_db(report: Dict[str, Any]) -> Dict[str, Any]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO public.case_reports (
                worker_identifier,
                patient_name,
                patient_age_years,
                patient_gender,
                village,
                district,
                state,
                symptoms,
                severity,
                temperature,
                duration_days,
                notes,
                sync_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, reported_at
        """,
            report.get("worker_id") or report.get("worker_identifier", "ASHA-MOBILE"),
            report.get("patient_name", "Anonymous Patient"),
            report.get("patient_age") or report.get("patient_age_years", 30),
            report.get("patient_gender", "F"),
            report.get("village", "Local Ward"),
            report.get("district", "Pune"),
            report.get("state", "Maharashtra"),
            report.get("symptoms", []),
            report.get("severity", "AMBER"),
            float(report.get("temperature", 98.6)),
            int(report.get("duration_days", 2)),
            report.get("notes", "Submitted via mobile intake"),
            report.get("sync_status", "ONLINE")
        )
        report["id"] = str(row["id"])
        report["reported_at"] = row["reported_at"].isoformat()
        return report

# --- HEALTH CENTER INVENTORY ---
async def fetch_inventory_from_db() -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, center_name, district, item, stock, status, bed_capacity, on_duty_doctors, latitude, longitude
            FROM public.health_center_inventory
            ORDER BY id ASC
        """)
        return [dict(r) for r in rows]

# --- ASHA WORKERS ---
async def fetch_asha_workers_from_db() -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM public.asha_workers ORDER BY name ASC")
        return [dict(r) for r in rows]
