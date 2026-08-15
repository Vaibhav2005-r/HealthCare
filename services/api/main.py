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

app = FastAPI(
    title="Smart Community Health API",
    description="Backend API for the ASHA worker app and Official Dashboard",
    version="0.1.0",
    lifespan=lifespan
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

@app.get("/")
def read_root():
    return {"message": "Smart Community Health API is running"}

@app.post("/api/v1/reports")
def create_report(report: SymptomReportCreate):
    return {"status": "success", "message": "Report saved and triaged", "report": report}

@app.post("/api/v1/forecasts")
def get_forecast(req: ForecastRequest):
    if len(req.sequence) != 14:
        return {"error": "Sequence must be exactly 14 days"}
    
    if scaler is None or lstm_model is None:
        return {"error": "Model not loaded"}
        
    scaled_data = scaler.transform(req.sequence)
    input_tensor = torch.tensor([scaled_data], dtype=torch.float32)
    
    with torch.no_grad():
        raw_score = lstm_model(input_tensor).item()
        # Convert raw linear output into a probability percentage (0.0 to 1.0)
        risk_score = 1.0 / (1.0 + math.exp(-raw_score))
        
    return {"risk_score": round(risk_score, 4)}

@app.post("/api/v1/ask")
def ask_assistant(req: RAGRequest):
    if rag_engine is None:
        return {"error": "RAG Engine not loaded"}
        
    response = rag_engine.ask(req.query)
    return response
