import os
import asyncpg
from datetime import datetime, timezone
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

def parse_datetime(val: Any) -> datetime:
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)

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
            if hasattr(d.get('created_at'), 'isoformat'):
                d['created_at'] = d['created_at'].isoformat()
            if hasattr(d.get('resolved_at'), 'isoformat'):
                d['resolved_at'] = d['resolved_at'].isoformat()
            if hasattr(d.get('acknowledged_at'), 'isoformat'):
                d['acknowledged_at'] = d['acknowledged_at'].isoformat()
            alerts.append(d)
        return alerts

async def fetch_alert_audit_logs_from_db(alert_id: Optional[str] = None) -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if alert_id:
            rows = await conn.fetch(
                "SELECT * FROM public.alert_audit_logs WHERE alert_id = $1 ORDER BY created_at DESC",
                alert_id
            )
        else:
            rows = await conn.fetch("SELECT * FROM public.alert_audit_logs ORDER BY created_at DESC LIMIT 100")
            
        logs = []
        for r in rows:
            d = dict(r)
            if hasattr(d.get('created_at'), 'isoformat'):
                d['created_at'] = d['created_at'].isoformat()
            if hasattr(d.get('id'), '__str__'):
                d['id'] = str(d['id'])
            logs.append(d)
        return logs

async def update_alert_status_in_db(
    alert_id: str,
    new_status: str,
    action_by: str = "Dr. S. Kulkarni (CMO)",
    action_role: str = "Chief Medical Officer / DHO",
    action_notes: Optional[str] = None
) -> Dict[str, Any]:
    pool = await get_db_pool()
    now_utc = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        # Get previous status
        prev_row = await conn.fetchrow("SELECT * FROM public.alerts WHERE id = $1", alert_id)
        if not prev_row:
            raise ValueError(f"Alert with ID {alert_id} not found.")
        prev_status = prev_row["status"]
        
        # Prepare timestamp and officer fields
        resolved_at = now_utc if new_status == "RESOLVED" else prev_row["resolved_at"]
        resolved_by = action_by if new_status == "RESOLVED" else prev_row["resolved_by"]
        resolved_by_role = action_role if new_status == "RESOLVED" else prev_row["resolved_by_role"]
        resolution_notes = action_notes if new_status == "RESOLVED" else prev_row["resolution_notes"]
        
        acknowledged_at = now_utc if new_status in ["ACKNOWLEDGED", "INVESTIGATING"] and not prev_row["acknowledged_at"] else prev_row["acknowledged_at"]
        acknowledged_by = action_by if new_status in ["ACKNOWLEDGED", "INVESTIGATING"] and not prev_row["acknowledged_by"] else prev_row["acknowledged_by"]

        # 1. Update alert
        updated_row = await conn.fetchrow("""
            UPDATE public.alerts
            SET status = $1,
                resolved_at = $2,
                resolved_by = $3,
                resolved_by_role = $4,
                resolution_notes = $5,
                acknowledged_at = $6,
                acknowledged_by = $7
            WHERE id = $8
            RETURNING *
        """, new_status, resolved_at, resolved_by, resolved_by_role, resolution_notes, acknowledged_at, acknowledged_by, alert_id)
        
        # 2. Insert immutable audit log entry
        await conn.execute("""
            INSERT INTO public.alert_audit_logs (alert_id, previous_status, new_status, action_by, action_role, action_notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, alert_id, prev_status, new_status, action_by, action_role, action_notes, now_utc)
        
        res = dict(updated_row)
        for k, v in res.items():
            if hasattr(v, 'isoformat'):
                res[k] = v.isoformat()
        return res

async def insert_alert_to_db(alert: Dict[str, Any]) -> Dict[str, Any]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if not alert.get("id"):
            count = await conn.fetchval("SELECT COUNT(*) FROM public.alerts")
            alert["id"] = f"alt-{(count or 0) + 1:02d}"
            
        dt_val = parse_datetime(alert.get("timestamp"))
            
        await conn.execute("""
            INSERT INTO public.alerts (id, district, state, type, severity, risk_score, cases_count, worker_role, timestamp, summary, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
                district = EXCLUDED.district,
                severity = EXCLUDED.severity,
                risk_score = EXCLUDED.risk_score,
                cases_count = EXCLUDED.cases_count,
                status = EXCLUDED.status,
                timestamp = EXCLUDED.timestamp
        """, 
            alert.get("id"),
            alert.get("district", "Maharashtra HQ"),
            alert.get("state", "Maharashtra"),
            alert.get("type", "SOS_TRIGGER"),
            alert.get("severity", "CRITICAL"),
            float(alert.get("risk_score", 0.85)),
            int(alert.get("cases_count", 1)),
            alert.get("worker_role", "ASHA Lead"),
            dt_val,
            alert.get("summary", "Emergency outbreak alert"),
            alert.get("status", "UNACKNOWLEDGED")
        )
        alert["timestamp"] = dt_val.isoformat()
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
                elif hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                    d[k] = str(v)
            reports.append(d)
        return reports

async def insert_case_report_to_db(report: Dict[str, Any]) -> Dict[str, Any]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        dt_val = parse_datetime(report.get("reported_at"))
        
        lat = report.get("latitude") or report.get("location_lat")
        lng = report.get("longitude") or report.get("location_lng")
        accuracy = report.get("accuracy_meters") or report.get("location_accuracy")
        comorbidities = list(report.get("comorbidities", []))
        medication = report.get("medication_taken") or report.get("medicationTaken")
        suspected = report.get("disease_type") or report.get("suspected_disease", "UNKNOWN")
        manual_reason = report.get("manual_location_reason") or report.get("manual_reason_code")

        row = await conn.fetchrow("""
            INSERT INTO public.case_reports (
                worker_identifier,
                patient_name,
                patient_age_years,
                patient_gender,
                village,
                block,
                district,
                state,
                latitude,
                longitude,
                accuracy_meters,
                manual_reason_code,
                symptoms,
                suspected_disease,
                comorbidities,
                medication_taken,
                severity,
                temperature,
                temperature_unit,
                duration_days,
                location_source,
                notes,
                sync_status,
                reported_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING id, reported_at
        """,
            report.get("worker_id") or report.get("worker_identifier", "ASHA-MOBILE"),
            report.get("patient_name", "Anonymous Patient"),
            int(report.get("patient_age") or report.get("patient_age_years", 30)),
            report.get("patient_gender", "F"),
            report.get("village", "Local Ward"),
            report.get("block"),
            report.get("district", "Pune"),
            report.get("state", "Maharashtra"),
            float(lat) if lat is not None else None,
            float(lng) if lng is not None else None,
            float(accuracy) if accuracy is not None else None,
            manual_reason,
            list(report.get("symptoms", [])),
            suspected,
            comorbidities,
            medication,
            report.get("severity", "AMBER"),
            float(report.get("temperature", 98.6)) if report.get("temperature") is not None else None,
            report.get("temperature_unit", "F"),
            int(report.get("duration_days", 2)),
            report.get("location_source", "gps_auto"),
            report.get("notes", "Submitted via mobile intake"),
            report.get("sync_status", "ONLINE"),
            dt_val
        )
        report["id"] = str(row["id"])
        report["reported_at"] = row["reported_at"].isoformat()
        return report

# --- HEALTH CENTER INVENTORY ---
async def fetch_inventory_from_db() -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, center_name, district, item, stock, status, bed_capacity, on_duty_doctors, latitude, longitude, updated_at
            FROM public.health_center_inventory
            ORDER BY id ASC
        """)
        inventory = []
        for r in rows:
            d = dict(r)
            if hasattr(d.get('updated_at'), 'isoformat'):
                d['updated_at'] = d['updated_at'].isoformat()
            inventory.append(d)
        return inventory

# --- ASHA WORKERS & AUTH ---
async def fetch_asha_workers_from_db() -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM public.asha_workers ORDER BY full_name ASC")
        workers = []
        for r in rows:
            d = dict(r)
            for k, v in d.items():
                if hasattr(v, 'isoformat'):
                    d[k] = v.isoformat()
                elif hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                    d[k] = str(v)
            workers.append(d)
        return workers

async def fetch_worker_profile_from_db(phone_number: str) -> Optional[Dict[str, Any]]:
    pool = await get_db_pool()
    clean_phone = phone_number.strip().replace("+91", "").replace(" ", "").replace("-", "")
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, phone_number, full_name, role, block, district, state, created_at
            FROM public.asha_workers
            WHERE phone_number = $1 OR phone_number = $2
            LIMIT 1
        """, clean_phone, phone_number.strip())
        if not row:
            return None
        d = dict(row)
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
            elif hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                d[k] = str(v)
        return d

# --- VILLAGES ---
async def fetch_villages_from_db(district: Optional[str] = None, block: Optional[str] = None) -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if district and block:
            rows = await conn.fetch(
                "SELECT id, village_name, block, district, state, population, latitude, longitude "
                "FROM public.villages "
                "WHERE LOWER(district) = LOWER($1) AND LOWER(block) = LOWER($2) "
                "ORDER BY village_name ASC",
                district, block
            )
        elif district:
            rows = await conn.fetch(
                "SELECT id, village_name, block, district, state, population, latitude, longitude "
                "FROM public.villages "
                "WHERE LOWER(district) = LOWER($1) "
                "ORDER BY village_name ASC",
                district
            )
        else:
            rows = await conn.fetch(
                "SELECT id, village_name, block, district, state, population, latitude, longitude "
                "FROM public.villages "
                "ORDER BY village_name ASC"
            )
        villages = []
        for r in rows:
            d = dict(r)
            d["id"] = str(d["id"])
            villages.append(d)
        return villages

# --- CLINICAL GUIDANCE ---
async def fetch_clinical_guidance_from_db(query: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if query:
            search_pattern = f"%{query.strip().lower()}%"
            rows = await conn.fetch(
                "SELECT id, condition, category, severity_tier, trigger_symptoms, immediate_action, "
                "red_flags, standard_dosage, isolation_protocol, source_document, page_number "
                "FROM public.clinical_guidance "
                "WHERE LOWER(condition) LIKE $1 "
                "   OR LOWER(category) LIKE $1 "
                "   OR LOWER(immediate_action) LIKE $1 "
                "   OR $2 = ANY(trigger_symptoms) "
                "ORDER BY condition ASC",
                search_pattern,
                query.strip()
            )
        elif category:
            rows = await conn.fetch(
                "SELECT id, condition, category, severity_tier, trigger_symptoms, immediate_action, "
                "red_flags, standard_dosage, isolation_protocol, source_document, page_number "
                "FROM public.clinical_guidance "
                "WHERE LOWER(category) = LOWER($1) "
                "ORDER BY condition ASC",
                category.strip()
            )
        else:
            rows = await conn.fetch(
                "SELECT id, condition, category, severity_tier, trigger_symptoms, immediate_action, "
                "red_flags, standard_dosage, isolation_protocol, source_document, page_number "
                "FROM public.clinical_guidance "
                "ORDER BY condition ASC"
            )
            
        guidance = []
        for r in rows:
            d = dict(r)
            d["id"] = str(d["id"])
            guidance.append(d)
        return guidance

