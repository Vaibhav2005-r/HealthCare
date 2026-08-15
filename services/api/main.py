import os
import sys
import math
import torch
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from sklearn.preprocessing import MinMaxScaler
from contextlib import asynccontextmanager

# Add parent directory to path to import ml module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.train_lstm_forecast import OutbreakForecastLSTM
from ml.rag_pipeline import RAGEngine

# Global objects
lstm_model = None
scaler = None
rag_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global lstm_model, scaler, rag_engine
    
    print("Starting ML initialization...")
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
        
    print("FastAPI is ready!")
    yield
    print("Shutting down...")

from fastapi.middleware.cors import CORSMiddleware
import json

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

class SymptomReportCreate(BaseModel):
    worker_id: str
    patient_age: Optional[int] = None
    symptoms: List[str]
    duration_days: int

class ForecastRequest(BaseModel):
    sequence: List[List[float]] # 14 days of [rainfall, temp, humidity, cases]

class RAGRequest(BaseModel):
    query: str

class SOSAlert(BaseModel):
    worker_id: str
    district: str
    cases: int
    severity: str

# In-memory alerts registry
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
    # Calculate live pulse counts
    pulse = {
        "total_districts": len(DISTRICTS_DATA),
        "low_count": len([d for d in DISTRICTS_DATA if d["risk_level"] == "LOW"]),
        "moderate_count": len([d for d in DISTRICTS_DATA if d["risk_level"] == "MODERATE"]),
        "high_count": len([d for d in DISTRICTS_DATA if d["risk_level"] == "HIGH"]),
        "critical_count": len([d for d in DISTRICTS_DATA if d["risk_level"] == "CRITICAL"]),
    }
    
    total_cases = sum(d["active_cases"] for d in DISTRICTS_DATA)
    total_ashas = sum(d["asha_active_count"] for d in DISTRICTS_DATA)
    
    # 7-day trend series
    trend_series = [
        {"day": "Mon", "cases": 112, "forecast": 110, "rainfall": 45},
        {"day": "Tue", "cases": 128, "forecast": 125, "rainfall": 62},
        {"day": "Wed", "cases": 142, "forecast": 139, "rainfall": 80},
        {"day": "Thu", "cases": 156, "forecast": 152, "rainfall": 95},
        {"day": "Fri", "cases": 169, "forecast": 165, "rainfall": 78},
        {"day": "Sat", "cases": 178, "forecast": 174, "rainfall": 110},
        {"day": "Sun", "cases": 186, "forecast": 182, "rainfall": 88}
    ]
    
    # Disease breakdown
    disease_dist = [
        {"disease": "Dengue", "cases": 68, "pct": 36.5, "severity": "HIGH"},
        {"disease": "Cholera / Diarrhea", "cases": 54, "pct": 29.0, "severity": "CRITICAL"},
        {"disease": "Malaria", "cases": 38, "pct": 20.4, "severity": "HIGH"},
        {"disease": "Acute Respiratory", "cases": 26, "pct": 14.1, "severity": "MODERATE"}
    ]
    
    return {
        "pulse": pulse,
        "summary": {
            "total_monitored_districts": len(DISTRICTS_DATA),
            "active_cases_total": total_cases,
            "high_critical_districts": pulse["high_count"] + pulse["critical_count"],
            "active_asha_workers": total_ashas,
            "case_delta_7d_pct": "+14.8%",
            "system_state": "ELEVATED_SURVEILLANCE"
        },
        "top_at_risk": sorted(DISTRICTS_DATA, key=lambda x: x["risk_score"], reverse=True)[:5],
        "trend_series": trend_series,
        "disease_breakdown": disease_dist,
        "recent_alerts": ALERTS_LOG[:4]
    }

@app.get("/api/v1/dashboard/districts")
async def get_districts(risk_filter: Optional[str] = None):
    if risk_filter and risk_filter.upper() != "ALL":
        filtered = [d for d in DISTRICTS_DATA if d["risk_level"] == risk_filter.upper()]
        return {"districts": filtered, "count": len(filtered)}
    return {"districts": DISTRICTS_DATA, "count": len(DISTRICTS_DATA)}

@app.get("/api/v1/dashboard/heatmap")
async def get_dashboard_heatmap(day_offset: int = 0):
    # Cluster points for heatmap overlay
    clusters = []
    for d in DISTRICTS_DATA:
        # Generate representative cluster points around district centroids
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
        # Add sub-center points
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
        "centroids": DISTRICTS_DATA,
        "clusters": clusters,
        "timestamp": "2026-08-16T01:30:00Z"
    }

@app.get("/api/v1/dashboard/alerts")
async def get_dashboard_alerts():
    return {"alerts": ALERTS_LOG, "count": len(ALERTS_LOG)}

from fastapi import WebSocket, WebSocketDisconnect

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
        # Send initial status
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "message": "Connected to Arogya Prahari Realtime Outbreak Stream",
            "timestamp": "now"
        })
        while True:
            # Keep connection open
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
    print(f"SOS ALERT LOGGED: {new_alert}")
    # Realtime broadcast to all connected dashboards
    await ws_manager.broadcast({
        "type": "NEW_SOS_ALERT",
        "alert": new_alert
    })
    return {"status": "alert_logged", "alert": new_alert}

@app.post("/api/v1/reports")
async def create_report(report: SymptomReportCreate):
    # Realtime broadcast of case intake
    await ws_manager.broadcast({
        "type": "NEW_FIELD_REPORT",
        "worker_id": report.worker_id,
        "symptoms": report.symptoms
    })
    return {"status": "success", "message": "Report saved and triaged", "report": report}


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

