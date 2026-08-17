import os
import sys
import math
import torch
import pandas as pd
import httpx
import asyncio
import random
import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers import gis, analytics, telemetry, resources, rag_admin, exports
from pydantic import BaseModel
from typing import List, Optional
from sklearn.preprocessing import MinMaxScaler
from contextlib import asynccontextmanager

from database.connection import init_db_pool, close_db_pool, get_db_pool

# Add parent directory to path to import ml module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.train_lstm_forecast import OutbreakForecastLSTM
from ml.rag_pipeline import RAGEngine

# Global objects
lstm_model = None
scaler = None
rag_engine = None

OFFLINE_SYNC_DATABASE_PATH = Path(
    os.getenv("OFFLINE_SYNC_DATABASE_PATH", os.path.join(os.path.dirname(__file__), "offline_sync.db"))
)

def initialise_offline_sync_database():
    """Create durable idempotency storage for reports retried by mobile workers."""
    with sqlite3.connect(OFFLINE_SYNC_DATABASE_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS synced_reports (
                client_report_id TEXT PRIMARY KEY,
                report_json TEXT NOT NULL,
                received_at TEXT NOT NULL
            )
        """)

def persist_report(report: "SymptomReportCreate") -> tuple[bool, dict]:
    """Store a report once; return the original result on a safe retry."""
    client_report_id = report.client_report_id or str(uuid4())
    received_at = datetime.now(timezone.utc).isoformat()
    stored_report = report.model_dump(mode="json")
    stored_report["client_report_id"] = client_report_id
    stored_report["received_at"] = received_at

    with sqlite3.connect(OFFLINE_SYNC_DATABASE_PATH) as connection:
        try:
            connection.execute(
                "INSERT INTO synced_reports (client_report_id, report_json, received_at) VALUES (?, ?, ?)",
                (client_report_id, json.dumps(stored_report), received_at),
            )
            return True, stored_report
        except sqlite3.IntegrityError:
            row = connection.execute(
                "SELECT report_json FROM synced_reports WHERE client_report_id = ?", (client_report_id,)
            ).fetchone()
            return False, json.loads(row[0])

@asynccontextmanager
async def lifespan(app: FastAPI):
    global lstm_model, scaler, rag_engine
    
    print("Starting database & ML initialization...")
    # 0. Init Local Idempotency DB & Supabase Connection Pool
    initialise_offline_sync_database()
    await init_db_pool()

    # 1. Init RAG
    rag_engine = RAGEngine()
    
    # 2. Init LSTM
    print("Loading LSTM model...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(os.path.dirname(base_dir), "ml")
    
    lstm_model = OutbreakForecastLSTM(input_size=4, hidden_size=32, num_layers=2, output_size=1)
    model_path = os.path.join(ml_dir, "lstm_forecast_model.pt")
    if os.path.exists(model_path):
        lstm_model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu'), weights_only=True))
    lstm_model.eval()
    
    # 3. Fit Scaler dynamically from synthetic data
    print("Fitting Scaler...")
    data_path = os.path.join(ml_dir, "outbreak_time_series.csv")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        features = ['rainfall_mm', 'avg_temp_c', 'humidity_pct', 'daily_cases']
        scaler = MinMaxScaler(feature_range=(-1, 1))
        scaler.fit(df[features].values)
        
    print("FastAPI is ready! Starting background telemetry worker...")
    asyncio.create_task(telemetry_worker())
    
    yield
    print("Shutting down...")
    await close_db_pool()

app = FastAPI(
    title="Arogya Prahari - Outbreak Intelligence API",
    description="Backend API for ASHA field reports, Outbreak DL forecasting, and Command Dashboard",
    version="0.2.0",
    lifespan=lifespan
)

# Enable CORS for dashboard web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gis.router)
app.include_router(analytics.router)
app.include_router(telemetry.router)
app.include_router(resources.router)
app.include_router(rag_admin.router)
app.include_router(exports.router)

class SymptomReportCreate(BaseModel):
    worker_id: str
    patient_name: Optional[str] = "Unknown"
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = "O"
    village: Optional[str] = None
    village_id: Optional[str] = None
    district: Optional[str] = "Pune"
    symptoms: List[str]
    duration_days: int = 1
    disease_type: Optional[str] = "UNKNOWN"
    severity: Optional[str] = "MILD"
    temperature: Optional[float] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    client_report_id: Optional[str] = None
    notes: Optional[str] = None

class SyncBatchRequest(BaseModel):
    reports: List[SymptomReportCreate]

class ForecastRequest(BaseModel):
    sequence: List[List[float]] # 14 days of [rainfall, temp, humidity, cases]

class RAGRequest(BaseModel):
    query: str

class SOSAlert(BaseModel):
    worker_id: str
    district: str
    cases: int
    severity: str

# In-memory alerts registry (fallback)
ALERTS_LOG = [
    {
        "id": "alt-01",
        "district": "Pune",
        "state": "Maharashtra",
        "type": "SOS_TRIGGER",
        "severity": "CRITICAL",
        "risk_score": 0.89,
        "cases_count": 18,
        "worker_role": "ASHA Lead (Haveli Block)",
        "timestamp": "2026-08-16T01:15:00Z",
        "summary": "URGENT: Cluster of 18 severe diarrhea and acute dehydration cases reported within 6 hours. High risk of localized Cholera outbreak. Immediate IV fluids and isolation protocol required.",
        "status": "UNACKNOWLEDGED"
    },
    {
        "id": "alt-02",
        "district": "Nashik",
        "state": "Maharashtra",
        "type": "ML_SPIKE_PREDICTION",
        "severity": "HIGH",
        "risk_score": 0.76,
        "cases_count": 12,
        "worker_role": "ANM Supervisor (Trimbak)",
        "timestamp": "2026-08-15T22:40:00Z",
        "summary": "SPATIAL ANOMALY: Dengue incidence increased 42% over baseline following heavy rainfall (112mm). Vector transmission rate accelerating across 3 adjacent sub-centers.",
        "status": "INVESTIGATING"
    },
    {
        "id": "alt-03",
        "district": "Thane",
        "state": "Maharashtra",
        "type": "ML_SPIKE_PREDICTION",
        "severity": "HIGH",
        "risk_score": 0.72,
        "cases_count": 14,
        "worker_role": "PHC Officer (Bhiwandi)",
        "timestamp": "2026-08-15T18:20:00Z",
        "summary": "THRESHOLD EXCEEDED: Malaria positive test strip confirmations crossed the 95th percentile trigger. Deploy additional rapid diagnostic kits.",
        "status": "ACKNOWLEDGED"
    },
    {
        "id": "alt-04",
        "district": "Kolhapur",
        "state": "Maharashtra",
        "type": "SOS_TRIGGER",
        "severity": "MODERATE",
        "risk_score": 0.54,
        "cases_count": 7,
        "worker_role": "ASHA Worker (Karvir)",
        "timestamp": "2026-08-15T14:10:00Z",
        "summary": "EARLY WARNING: 7 suspected viral fever cases with joint pain reported. ASHA workers deployed for active house-to-house screening.",
        "status": "RESOLVED"
    }
]

DISTRICTS_DATA = [
    {
        "district_id": "MH-PUN",
        "name": "Pune",
        "state": "Maharashtra",
        "centroid_lat": 18.5204,
        "centroid_lng": 73.8567,
        "risk_level": "CRITICAL",
        "risk_score": 0.89,
        "active_cases": 48,
        "trend_7d": "UP",
        "trend_pct": 34.5,
        "primary_suspected": "Cholera / Acute Diarrhea",
        "population": "9,429,408",
        "asha_active_count": 142,
        "rainfall_mm": 88.4,
        "humidity_pct": 84,
        "last_reported": "12 mins ago"
    },
    {
        "district_id": "MH-NSK",
        "name": "Nashik",
        "state": "Maharashtra",
        "centroid_lat": 19.9975,
        "centroid_lng": 73.7898,
        "risk_level": "HIGH",
        "risk_score": 0.76,
        "active_cases": 32,
        "trend_7d": "UP",
        "trend_pct": 21.0,
        "primary_suspected": "Dengue",
        "population": "6,107,187",
        "asha_active_count": 98,
        "rainfall_mm": 112.0,
        "humidity_pct": 89,
        "last_reported": "35 mins ago"
    },
    {
        "district_id": "MH-THA",
        "name": "Thane",
        "state": "Maharashtra",
        "centroid_lat": 19.2183,
        "centroid_lng": 72.9781,
        "risk_level": "HIGH",
        "risk_score": 0.72,
        "active_cases": 29,
        "trend_7d": "UP",
        "trend_pct": 18.2,
        "primary_suspected": "Malaria",
        "population": "11,060,148",
        "asha_active_count": 184,
        "rainfall_mm": 64.2,
        "humidity_pct": 81,
        "last_reported": "1 hour ago"
    },
    {
        "district_id": "MH-KOP",
        "name": "Kolhapur",
        "state": "Maharashtra",
        "centroid_lat": 16.7050,
        "centroid_lng": 74.2433,
        "risk_level": "MODERATE",
        "risk_score": 0.54,
        "active_cases": 17,
        "trend_7d": "FLAT",
        "trend_pct": 1.5,
        "primary_suspected": "Viral Fever",
        "population": "3,876,001",
        "asha_active_count": 76,
        "rainfall_mm": 45.0,
        "humidity_pct": 72,
        "last_reported": "2 hours ago"
    },
    {
        "district_id": "MH-AUR",
        "name": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "centroid_lat": 19.8762,
        "centroid_lng": 75.3433,
        "risk_level": "MODERATE",
        "risk_score": 0.48,
        "active_cases": 14,
        "trend_7d": "DOWN",
        "trend_pct": -8.4,
        "primary_suspected": "ARI / Flu",
        "population": "3,701,282",
        "asha_active_count": 82,
        "rainfall_mm": 22.1,
        "humidity_pct": 65,
        "last_reported": "3 hours ago"
    },
    {
        "district_id": "MH-NAG",
        "name": "Nagpur",
        "state": "Maharashtra",
        "centroid_lat": 21.1458,
        "centroid_lng": 79.0882,
        "risk_level": "LOW",
        "risk_score": 0.22,
        "active_cases": 6,
        "trend_7d": "DOWN",
        "trend_pct": -15.0,
        "primary_suspected": "Seasonal",
        "population": "4,653,570",
        "asha_active_count": 110,
        "rainfall_mm": 12.0,
        "humidity_pct": 58,
        "last_reported": "4 hours ago"
    },
    {
        "district_id": "MH-MUM",
        "name": "Mumbai Suburban",
        "state": "Maharashtra",
        "centroid_lat": 19.0760,
        "centroid_lng": 72.8777,
        "risk_level": "LOW",
        "risk_score": 0.28,
        "active_cases": 11,
        "trend_7d": "FLAT",
        "trend_pct": -2.0,
        "primary_suspected": "Dengue",
        "population": "12,442,373",
        "asha_active_count": 230,
        "rainfall_mm": 38.0,
        "humidity_pct": 79,
        "last_reported": "30 mins ago"
    },
    {
        "district_id": "MH-SAT",
        "name": "Satara",
        "state": "Maharashtra",
        "centroid_lat": 17.6805,
        "centroid_lng": 73.9997,
        "risk_level": "LOW",
        "risk_score": 0.18,
        "active_cases": 4,
        "trend_7d": "DOWN",
        "trend_pct": -22.0,
        "primary_suspected": "None",
        "population": "3,003,741",
        "asha_active_count": 64,
        "rainfall_mm": 18.5,
        "humidity_pct": 60,
        "last_reported": "5 hours ago"
    }
]

async def refresh_district_telemetry():
    global DISTRICTS_DATA, lstm_model, scaler
    print("Refreshing district telemetry via Open-Meteo & LSTM...")
    try:
        async with httpx.AsyncClient() as client:
            for district in DISTRICTS_DATA:
                # 1. Fetch live weather
                lat, lng = district["centroid_lat"], district["centroid_lng"]
                url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto"
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    temp = data["current"]["temperature_2m"]
                    humidity = data["current"]["relative_humidity_2m"]
                    precip = data["current"]["precipitation"]
                    
                    district["rainfall_mm"] = precip
                    district["humidity_pct"] = humidity
                    
                    # 2. LSTM Inference
                    if lstm_model and scaler:
                        base_cases = district["active_cases"]
                        sequence = []
                        for i in range(13):
                            sequence.append([0.0, temp, humidity, max(0, base_cases - (13-i))])
                        sequence.append([precip, temp, humidity, base_cases])
                        
                        scaled_data = scaler.transform(sequence)
                        input_tensor = torch.from_numpy(scaled_data).float().unsqueeze(0)
                        
                        with torch.no_grad():
                            raw_score = lstm_model(input_tensor).item()
                            risk_score = 1.0 / (1.0 + math.exp(-raw_score))
                            
                        district["risk_score"] = round(risk_score, 4)
                        if risk_score > 0.80:
                            district["risk_level"] = "CRITICAL"
                        elif risk_score > 0.65:
                            district["risk_level"] = "HIGH"
                        elif risk_score > 0.40:
                            district["risk_level"] = "MODERATE"
                        else:
                            district["risk_level"] = "LOW"
                            
                        if random.random() > 0.5:
                            if district["risk_level"] in ["HIGH", "CRITICAL"]:
                                district["active_cases"] += random.randint(1, 3)
                            else:
                                district["active_cases"] = max(0, district["active_cases"] - random.randint(0, 2))
                                
                    district["last_reported"] = "Just now (Live)"
    except Exception as e:
        print(f"Error during telemetry refresh: {e}")

async def telemetry_worker():
    await asyncio.sleep(5)
    while True:
        await refresh_district_telemetry()
        await asyncio.sleep(600)

async def get_all_districts_data() -> List[dict]:
    pool = await get_db_pool()
    if pool:
        try:
            records = await pool.fetch("""
                SELECT district_id, name, state, centroid_lat, centroid_lng, risk_level,
                       risk_score, active_cases, trend_7d, trend_pct, primary_suspected,
                       population, asha_active_count, rainfall_mm, humidity_pct, last_reported
                FROM districts
                ORDER BY risk_score DESC;
            """)
            if records:
                return [dict(r) for r in records]
        except Exception as e:
            print(f"[Database] Error querying districts from Supabase: {e}")
    return DISTRICTS_DATA

async def get_all_alerts_data() -> List[dict]:
    pool = await get_db_pool()
    if pool:
        try:
            records = await pool.fetch("""
                SELECT id, district, state, type, severity, risk_score, cases_count,
                       worker_role, timestamp::text, summary, status
                FROM alerts
                ORDER BY timestamp DESC
                LIMIT 20;
            """)
            if records:
                return [dict(r) for r in records]
        except Exception as e:
            print(f"[Database] Error querying alerts from Supabase: {e}")
    return ALERTS_LOG

@app.get("/")
def read_root():
    return {
        "platform": "Arogya Prahari - Command Dashboard API",
        "tagline_en": "One view, every district's risk.",
        "tagline_hi": "एक नज़र, हर ज़िले की स्थिति",
        "status": "OPERATIONAL",
        "version": "0.2.0"
    }

@app.get("/api/v1/dashboard/live")
async def get_dashboard_live():
    districts = await get_all_districts_data()
    alerts = await get_all_alerts_data()

    pulse = {
        "total_districts": len(districts),
        "low_count": len([d for d in districts if d["risk_level"] == "LOW"]),
        "moderate_count": len([d for d in districts if d["risk_level"] == "MODERATE"]),
        "high_count": len([d for d in districts if d["risk_level"] == "HIGH"]),
        "critical_count": len([d for d in districts if d["risk_level"] == "CRITICAL"]),
    }
    
    total_cases = sum(d["active_cases"] for d in districts)
    total_ashas = sum(d["asha_active_count"] for d in districts)
    
    trend_series = [
        {"day": "Mon", "cases": 112, "forecast": 110, "rainfall": 45},
        {"day": "Tue", "cases": 128, "forecast": 125, "rainfall": 62},
        {"day": "Wed", "cases": 142, "forecast": 139, "rainfall": 80},
        {"day": "Thu", "cases": 156, "forecast": 152, "rainfall": 95},
        {"day": "Fri", "cases": 169, "forecast": 165, "rainfall": 78},
        {"day": "Sat", "cases": 178, "forecast": 174, "rainfall": 110},
        {"day": "Sun", "cases": 186, "forecast": 182, "rainfall": 88}
    ]
    
    disease_dist = [
        {"disease": "Dengue", "cases": 68, "pct": 36.5, "severity": "HIGH"},
        {"disease": "Cholera / Diarrhea", "cases": 54, "pct": 29.0, "severity": "CRITICAL"},
        {"disease": "Malaria", "cases": 38, "pct": 20.4, "severity": "HIGH"},
        {"disease": "Acute Respiratory", "cases": 26, "pct": 14.1, "severity": "MODERATE"}
    ]
    
    return {
        "pulse": pulse,
        "summary": {
            "total_monitored_districts": len(districts),
            "active_cases_total": total_cases,
            "high_critical_districts": pulse["high_count"] + pulse["critical_count"],
            "active_asha_workers": total_ashas,
            "case_delta_7d_pct": "+14.8%",
            "system_state": "ELEVATED_SURVEILLANCE"
        },
        "top_at_risk": sorted(districts, key=lambda x: x["risk_score"], reverse=True)[:5],
        "trend_series": trend_series,
        "disease_breakdown": disease_dist,
        "recent_alerts": alerts[:4]
    }

@app.get("/api/v1/dashboard/districts")
async def get_districts(risk_filter: Optional[str] = None):
    districts = await get_all_districts_data()
    if risk_filter and risk_filter.upper() != "ALL":
        filtered = [d for d in districts if d["risk_level"] == risk_filter.upper()]
        return {"districts": filtered, "count": len(filtered)}
    return {"districts": districts, "count": len(districts)}

@app.get("/api/v1/dashboard/heatmap")
async def get_dashboard_heatmap(day_offset: int = 0):
    districts = await get_all_districts_data()
    clusters = []
    for d in districts:
        base_intensity = d["risk_score"]
        clusters.append({
            "district": d["name"],
            "lat": d["centroid_lat"],
            "lng": d["centroid_lng"],
            "intensity": base_intensity,
            "risk_level": d["risk_level"],
            "cases": d["active_cases"],
            "primary_disease": d["primary_suspected"]
        })
        clusters.append({
            "district": f"{d['name']} Sub-Center 1",
            "lat": d["centroid_lat"] + 0.04,
            "lng": d["centroid_lng"] - 0.03,
            "intensity": round(max(0.1, base_intensity * 0.85), 2),
            "risk_level": d["risk_level"],
            "cases": max(1, int(d["active_cases"] * 0.4)),
            "primary_disease": d["primary_suspected"]
        })
        clusters.append({
            "district": f"{d['name']} Sub-Center 2",
            "lat": d["centroid_lat"] - 0.03,
            "lng": d["centroid_lng"] + 0.05,
            "intensity": round(max(0.1, base_intensity * 0.65), 2),
            "risk_level": d["risk_level"],
            "cases": max(1, int(d["active_cases"] * 0.3)),
            "primary_disease": d["primary_suspected"]
        })
        
    return {
        "day_offset": day_offset,
        "centroids": districts,
        "clusters": clusters,
        "timestamp": "2026-08-16T01:30:00Z"
    }

@app.get("/api/v1/dashboard/alerts")
async def get_dashboard_alerts():
    alerts = await get_all_alerts_data()
    return {"alerts": alerts, "count": len(alerts)}

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_manager = ConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "message": "Connected to Arogya Prahari Realtime Outbreak Stream",
            "timestamp": "now"
        })
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.post("/api/v1/alerts/sos")
async def trigger_sos_alert(alert: SOSAlert):
    new_alert = {
        "id": f"alt-{len(ALERTS_LOG) + 1:02d}",
        "district": alert.district,
        "state": "Maharashtra",
        "type": "SOS_TRIGGER",
        "severity": alert.severity.upper(),
        "risk_score": 0.92 if alert.severity.upper() == "CRITICAL" else 0.78,
        "cases_count": alert.cases,
        "worker_role": f"ASHA Lead ({alert.worker_id})",
        "timestamp": "Just now",
        "summary": f"MANUAL SOS: {alert.cases} {alert.severity} cases flagged immediately by {alert.worker_id} in {alert.district}.",
        "status": "UNACKNOWLEDGED"
    }
    ALERTS_LOG.insert(0, new_alert)
    
    pool = await get_db_pool()
    if pool:
        try:
            await pool.execute("""
                INSERT INTO alerts (id, district, state, type, severity, risk_score, cases_count, worker_role, summary, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING;
            """, new_alert["id"], new_alert["district"], new_alert["state"], new_alert["type"],
                 new_alert["severity"], new_alert["risk_score"], new_alert["cases_count"],
                 new_alert["worker_role"], new_alert["summary"], new_alert["status"])
            print(f"[Database] Persisted SOS alert {new_alert['id']} to Supabase.")
        except Exception as e:
            print(f"[Database] Failed to persist SOS alert to Supabase: {e}")

    print(f"SOS ALERT LOGGED: {new_alert}")
    await ws_manager.broadcast({
        "type": "NEW_SOS_ALERT",
        "alert": new_alert
    })
    return {"status": "alert_logged", "alert": new_alert}

@app.post("/api/v1/reports")
async def create_report(report: SymptomReportCreate):
    is_new, stored_report = persist_report(report)
    if not is_new:
        return {
            "status": "already_synced",
            "message": "Report was previously received",
            "report": stored_report,
        }

    saved_id = None
    lat = report.location_lat if report.location_lat is not None else report.latitude
    lng = report.location_lng if report.location_lng is not None else report.longitude

    pool = await get_db_pool()
    if pool:
        try:
            row = await pool.fetchrow("""
                INSERT INTO case_reports (
                    worker_identifier, patient_name, patient_age_years, patient_gender,
                    village, district, symptoms, duration_days, severity, temperature,
                    latitude, longitude, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id;
            """, report.worker_id, report.patient_name, report.patient_age, report.patient_gender,
                 report.village or report.village_id, report.district or "Pune", report.symptoms,
                 report.duration_days, report.severity or "MILD", report.temperature,
                 lat, lng, report.notes)
            if row:
                saved_id = str(row["id"])
                print(f"[Database] Case report inserted into Supabase with ID: {saved_id}")
        except Exception as e:
            print(f"[Database] Error inserting case report into Supabase: {e}")

    await ws_manager.broadcast({
        "type": "NEW_FIELD_REPORT",
        "report_id": saved_id,
        "worker_id": report.worker_id,
        "district": report.district,
        "symptoms": report.symptoms,
        "client_report_id": stored_report["client_report_id"],
    })
    return {
        "status": "success",
        "message": "Report saved and triaged",
        "report_id": saved_id,
        "report": stored_report
    }

@app.post("/api/v1/reports/sync")
async def sync_reports(payload: SyncBatchRequest):
    """Sync up to 100 offline reports with item-level retry results."""
    if not 1 <= len(payload.reports) <= 100:
        return {"attempted": len(payload.reports), "synced": 0, "failed": len(payload.reports), "results": [], "error": "Provide 1 to 100 reports"}

    results = []
    for report in payload.reports:
        try:
            result = await create_report(report)
            results.append({
                "clientReportId": report.client_report_id,
                "status": result["status"],
                "report": result.get("report"),
            })
        except Exception as exc:
            results.append({
                "clientReportId": report.client_report_id,
                "status": "failed",
                "error": str(exc),
            })

    synced = sum(item["status"] in {"success", "already_synced"} for item in results)
    return {"attempted": len(results), "synced": synced, "failed": len(results) - synced, "results": results}

@app.post("/api/v1/forecasts")
def get_forecast(req: ForecastRequest):
    if len(req.sequence) != 14:
        return {"error": "Sequence must be exactly 14 days"}
    
    if scaler is None or lstm_model is None:
        return {"error": "Model not loaded"}
        
    scaled_data = scaler.transform(req.sequence)
    input_tensor = torch.from_numpy(scaled_data).float().unsqueeze(0)
    
    with torch.no_grad():
        raw_score = lstm_model(input_tensor).item()
        risk_score = 1.0 / (1.0 + math.exp(-raw_score))
        
    return {"risk_score": round(risk_score, 4)}

@app.post("/api/v1/ask")
def ask_assistant(req: RAGRequest):
    if rag_engine is None:
        return {"error": "RAG Engine not loaded"}
        
    response = rag_engine.ask(req.query)
    return response
