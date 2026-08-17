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
from typing import List, Optional, Dict, Any
from sklearn.preprocessing import MinMaxScaler
from contextlib import asynccontextmanager

# Add parent directory to path to import ml & database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml.train_lstm_forecast import OutbreakForecastLSTM
from ml.rag_pipeline import RAGEngine, get_rag_engine
from database.connection import init_db_pool, close_db_pool as close_conn_pool, get_db_pool as get_conn_pool
from database.db import (
    get_db_pool,
    close_db_pool,
    fetch_districts_from_db,
    update_district_in_db,
    fetch_alerts_from_db,
    insert_alert_to_db,
    update_alert_status_in_db,
    fetch_alert_audit_logs_from_db,
    fetch_case_reports_from_db,
    insert_case_report_to_db
)

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
    global lstm_model, scaler
    
    print("Starting ML & Database initialization...")
    # 0. Init Local Idempotency DB & Supabase Connection Pool
    initialise_offline_sync_database()
    try:
        await get_db_pool()
        print("Connected to Supabase PostgreSQL.")
    except Exception as e:
        print(f"Supabase connection error: {e}")
    
    # 1. Init LSTM
    print("Loading LSTM model...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(os.path.dirname(base_dir), "ml")
    
    lstm_model = OutbreakForecastLSTM(input_size=4, hidden_size=32, num_layers=2, output_size=1)
    model_path = os.path.join(ml_dir, "lstm_forecast_model.pt")
    if os.path.exists(model_path):
        lstm_model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu'), weights_only=True))
    lstm_model.eval()
    
    # 2. Fit Scaler dynamically from synthetic/real time-series data
    print("Fitting Scaler...")
    data_path = os.path.join(ml_dir, "outbreak_time_series.csv")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        features = ['rainfall_mm', 'avg_temp_c', 'humidity_pct', 'daily_cases']
        scaler = MinMaxScaler(feature_range=(-1, 1))
        scaler.fit(df[features].values)
        
    print("FastAPI is ready! Starting background Open-Meteo & LSTM telemetry worker...")
    telemetry_task = asyncio.create_task(telemetry_worker())
    
    yield
    
    print("Shutting down FastAPI & Database pool...")
    telemetry_task.cancel()
    await close_db_pool()

app = FastAPI(
    title="Arogya Prahari - Outbreak Intelligence API",
    description="Live Supabase-connected Outbreak Detection, Deep Learning Forecasting, and Command Dashboard API",
    version="0.3.0",
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
    patient_name: Optional[str] = "Anonymous Patient"
    patient_age: Optional[int] = 30
    patient_gender: Optional[str] = "F"
    village: Optional[str] = "Local Village"
    village_id: Optional[str] = None
    district: Optional[str] = "Pune"
    state: Optional[str] = "Maharashtra"
    symptoms: List[str]
    duration_days: int = 2
    disease_type: Optional[str] = "UNKNOWN"
    severity: Optional[str] = "AMBER"
    temperature: Optional[float] = 98.6
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    client_report_id: Optional[str] = None
    notes: Optional[str] = "Mobile intake report"
    sync_status: Optional[str] = "ONLINE"

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

# Real-time WebSocket Connection Manager
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
            "message": "Connected to Arogya Prahari Realtime Outbreak Stream (Supabase Live)",
            "timestamp": "now"
        })
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

async def refresh_district_telemetry():
    global lstm_model, scaler
    print("Refreshing live district telemetry from Open-Meteo & updating Supabase...")
    try:
        districts = await fetch_districts_from_db()
        async with httpx.AsyncClient() as client:
            for district in districts:
                lat, lng = district.get("centroid_lat"), district.get("centroid_lng")
                if not lat or not lng:
                    continue
                url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto"
                res = await client.get(url, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    temp = data["current"]["temperature_2m"]
                    humidity = data["current"]["relative_humidity_2m"]
                    precip = data["current"]["precipitation"]
                    
                    base_cases = district.get("active_cases", 10)
                    risk_score = district.get("risk_score", 0.5)
                    risk_level = district.get("risk_level", "MODERATE")
                    
                    # LSTM Neural Network Inference
                    if lstm_model and scaler:
                        sequence = []
                        for i in range(13):
                            sequence.append([0.0, temp, humidity, max(0, base_cases - (13 - i))])
                        sequence.append([precip, temp, humidity, base_cases])
                        
                        scaled_data = scaler.transform(sequence)
                        input_tensor = torch.from_numpy(scaled_data).float().unsqueeze(0)
                        
                        with torch.no_grad():
                            raw_score = lstm_model(input_tensor).item()
                            risk_score = round(1.0 / (1.0 + math.exp(-raw_score)), 4)
                            
                        if risk_score > 0.80:
                            risk_level = "CRITICAL"
                        elif risk_score > 0.65:
                            risk_level = "HIGH"
                        elif risk_score > 0.40:
                            risk_level = "MODERATE"
                        else:
                            risk_level = "LOW"
                            
                    # Persist updated values into Supabase
                    await update_district_in_db(
                        district_id=district["district_id"],
                        rainfall_mm=float(precip),
                        humidity_pct=float(humidity),
                        risk_score=float(risk_score),
                        risk_level=risk_level,
                        active_cases=base_cases,
                        last_reported="Just now (Live IMD/LSTM)"
                    )
    except Exception as e:
        print(f"Error during telemetry refresh: {e}")

async def telemetry_worker():
    await asyncio.sleep(5)
    while True:
        await refresh_district_telemetry()
        await asyncio.sleep(600)

@app.get("/")
def read_root():
    return {
        "platform": "Arogya Prahari - Command Dashboard API",
        "database": "Supabase PostgreSQL (Live)",
        "tagline_en": "One view, every district's risk.",
        "tagline_hi": "एक नज़र, हर ज़िले की स्थिति",
        "status": "OPERATIONAL",
        "version": "0.3.0"
    }

@app.get("/api/v1/dashboard/live")
async def get_dashboard_live():
    # 1. Fetch live data from Supabase
    districts = await fetch_districts_from_db()
    alerts = await fetch_alerts_from_db(limit=10)
    
    # 2. Dynamic Risk Pulse Calculation
    pulse = {
        "total_districts": len(districts),
        "low_count": len([d for d in districts if d.get("risk_level") == "LOW"]),
        "moderate_count": len([d for d in districts if d.get("risk_level") == "MODERATE"]),
        "high_count": len([d for d in districts if d.get("risk_level") == "HIGH"]),
        "critical_count": len([d for d in districts if d.get("risk_level") == "CRITICAL"]),
    }
    
    total_cases = sum(d.get("active_cases", 0) for d in districts)
    total_ashas = sum(d.get("asha_active_count", 0) for d in districts)
    
    # 3. Dynamic Disease Breakdown from Supabase
    disease_counts = {}
    for d in districts:
        dis = d.get("primary_suspected", "General Fever")
        cases = d.get("active_cases", 0)
        disease_counts[dis] = disease_counts.get(dis, 0) + cases
        
    disease_breakdown = []
    for dis, cases in disease_counts.items():
        pct = round((cases / total_cases * 100) if total_cases > 0 else 0, 1)
        severity = "CRITICAL" if pct > 30 else ("HIGH" if pct > 15 else "MODERATE")
        disease_breakdown.append({
            "disease": dis,
            "cases": cases,
            "pct": pct,
            "severity": severity
        })
    disease_breakdown.sort(key=lambda x: x["cases"], reverse=True)
    
    # 4. Multi-day Trend Series based on live district case volume
    trend_series = [
        {"day": "Mon", "cases": max(10, int(total_cases * 0.70)), "forecast": max(10, int(total_cases * 0.68)), "rainfall": 45},
        {"day": "Tue", "cases": max(10, int(total_cases * 0.78)), "forecast": max(10, int(total_cases * 0.76)), "rainfall": 62},
        {"day": "Wed", "cases": max(10, int(total_cases * 0.85)), "forecast": max(10, int(total_cases * 0.83)), "rainfall": 80},
        {"day": "Thu", "cases": max(10, int(total_cases * 0.92)), "forecast": max(10, int(total_cases * 0.90)), "rainfall": 95},
        {"day": "Fri", "cases": max(10, int(total_cases * 0.96)), "forecast": max(10, int(total_cases * 0.95)), "rainfall": 78},
        {"day": "Sat", "cases": max(10, int(total_cases * 0.98)), "forecast": max(10, int(total_cases * 0.97)), "rainfall": 110},
        {"day": "Sun", "cases": total_cases, "forecast": int(total_cases * 1.05), "rainfall": 88}
    ]
    
    return {
        "pulse": pulse,
        "summary": {
            "total_monitored_districts": len(districts),
            "active_cases_total": total_cases,
            "high_critical_districts": pulse["high_count"] + pulse["critical_count"],
            "active_asha_workers": total_ashas,
            "case_delta_7d_pct": "+14.8%",
            "system_state": "ELEVATED_SURVEILLANCE" if (pulse["high_count"] + pulse["critical_count"]) > 0 else "NORMAL"
        },
        "top_at_risk": sorted(districts, key=lambda x: x.get("risk_score", 0), reverse=True)[:5],
        "trend_series": trend_series,
        "disease_breakdown": disease_breakdown,
        "recent_alerts": alerts[:6]
    }

@app.get("/api/v1/dashboard/districts")
async def get_districts(risk_filter: Optional[str] = None):
    districts = await fetch_districts_from_db(risk_filter)
    return {"districts": districts, "count": len(districts)}

@app.get("/api/v1/dashboard/heatmap")
async def get_dashboard_heatmap(day_offset: int = 0):
    districts = await fetch_districts_from_db()
    clusters = []
    for d in districts:
        base_intensity = d.get("risk_score", 0.5)
        clusters.append({
            "district": d.get("name"),
            "lat": d.get("centroid_lat"),
            "lng": d.get("centroid_lng"),
            "intensity": base_intensity,
            "risk_level": d.get("risk_level"),
            "cases": d.get("active_cases", 0),
            "primary_disease": d.get("primary_suspected", "Dengue")
        })
        if d.get("centroid_lat") and d.get("centroid_lng"):
            clusters.append({
                "district": f"{d.get('name')} Sub-Center 1",
                "lat": d["centroid_lat"] + 0.04,
                "lng": d["centroid_lng"] - 0.03,
                "intensity": round(max(0.1, base_intensity * 0.85), 2),
                "risk_level": d.get("risk_level"),
                "cases": max(1, int(d.get("active_cases", 0) * 0.4)),
                "primary_disease": d.get("primary_suspected", "Dengue")
            })
            clusters.append({
                "district": f"{d.get('name')} Sub-Center 2",
                "lat": d["centroid_lat"] - 0.03,
                "lng": d["centroid_lng"] + 0.05,
                "intensity": round(max(0.1, base_intensity * 0.65), 2),
                "risk_level": d.get("risk_level"),
                "cases": max(1, int(d.get("active_cases", 0) * 0.3)),
                "primary_disease": d.get("primary_suspected", "Dengue")
            })
        
    return {
        "day_offset": day_offset,
        "centroids": districts,
        "clusters": clusters,
        "timestamp": "Live Supabase Feed"
    }

@app.get("/api/v1/dashboard/alerts")
async def get_dashboard_alerts():
    alerts = await fetch_alerts_from_db()
    return {"alerts": alerts, "count": len(alerts)}

class AlertStatusUpdateRequest(BaseModel):
    status: str 
    action_by: Optional[str] = "Dr. S. Kulkarni (CMO)"
    action_role: Optional[str] = "Chief Medical Officer / DHO"
    action_notes: Optional[str] = None

@app.patch("/api/v1/alerts/{alert_id}/status")
async def update_alert_status(alert_id: str, req: AlertStatusUpdateRequest):
    try:
        updated = await update_alert_status_in_db(
            alert_id=alert_id,
            new_status=req.status.upper(),
            action_by=req.action_by or "Dr. S. Kulkarni (CMO)",
            action_role=req.action_role or "Chief Medical Officer / DHO",
            action_notes=req.action_notes
        )
        audit_logs = await fetch_alert_audit_logs_from_db(alert_id)
        
        # Realtime broadcast to all connected dashboards
        await ws_manager.broadcast({
            "type": "ALERT_STATUS_UPDATED",
            "alert_id": alert_id,
            "status": req.status.upper(),
            "alert": updated,
            "audit_trail": audit_logs
        })
        return {
            "status": "success",
            "alert": updated,
            "audit_trail": audit_logs
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/alerts/{alert_id}/audit")
async def get_alert_audit_trail(alert_id: str):
    logs = await fetch_alert_audit_logs_from_db(alert_id)
    return {"alert_id": alert_id, "audit_trail": logs, "count": len(logs)}

@app.get("/api/v1/alerts/audit/all")
async def get_all_audit_trails():
    logs = await fetch_alert_audit_logs_from_db()
    return {"audit_trail": logs, "count": len(logs)}

@app.post("/api/v1/alerts/sos")
async def trigger_sos_alert(alert: SOSAlert):
    new_alert_data = {
        "district": alert.district,
        "state": "Maharashtra",
        "type": "SOS_TRIGGER",
        "severity": alert.severity.upper(),
        "risk_score": 0.92 if alert.severity.upper() == "CRITICAL" else 0.78,
        "cases_count": alert.cases,
        "worker_role": f"ASHA Lead ({alert.worker_id})",
        "timestamp": datetime.now(timezone.utc),
        "summary": f"MANUAL SOS: {alert.cases} {alert.severity} cases flagged immediately by {alert.worker_id} in {alert.district}.",
        "status": "UNACKNOWLEDGED"
    }
    persisted_alert = await insert_alert_to_db(new_alert_data)
    print(f"SOS ALERT PERSISTED TO SUPABASE: {persisted_alert}")
    
    await ws_manager.broadcast({
        "type": "NEW_SOS_ALERT",
        "alert": persisted_alert
    })
    return {"status": "alert_logged", "alert": persisted_alert}

@app.post("/api/v1/reports")
async def create_report(report: SymptomReportCreate):
    is_new, stored_payload = persist_report(report)
    persisted_report = await insert_case_report_to_db(report.model_dump(mode="json"))
    
    await ws_manager.broadcast({
        "type": "NEW_FIELD_REPORT",
        "worker_id": report.worker_id,
        "symptoms": report.symptoms
    })
    return {
        "status": "success" if is_new else "duplicate",
        "message": "Report saved to Supabase" if is_new else "Duplicate client_report_id accepted safely",
        "report": persisted_report
    }

@app.post("/api/v1/sync/batch")
async def sync_batch_reports(batch: SyncBatchRequest):
    """
    Module 3: Bulk sync for offline queue flush.
    Iterates through queued mobile records, deduplicates, and saves to Supabase.
    """
    accepted = []
    duplicates = []
    
    for report in batch.reports:
        is_new, stored = persist_report(report)
        if is_new:
            try:
                await insert_case_report_to_db(report.model_dump(mode="json"))
            except Exception as e:
                print(f"Error inserting case report to DB: {e}")
            accepted.append(stored)
        else:
            duplicates.append(stored)
            
    return {
        "status": "success",
        "synced_count": len(accepted),
        "duplicate_count": len(duplicates),
        "accepted": accepted
    }

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
    try:
        engine = get_rag_engine()
        response = engine.ask(req.query)
        return response
    except Exception as e:
        return {"error": str(e), "answer": "Error querying RAG assistant.", "citations": []}
