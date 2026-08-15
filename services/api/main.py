from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Smart Community Health API",
    description="Backend API for the ASHA worker app and Official Dashboard",
    version="0.1.0"
)

class SymptomReportCreate(BaseModel):
    worker_id: str
    patient_age: Optional[int] = None
    symptoms: List[str]
    duration_days: int

@app.get("/")
def read_root():
    return {"message": "Smart Community Health API is running"}

@app.post("/api/v1/reports")
def create_report(report: SymptomReportCreate):
    # TODO: Save report to database
    # TODO: Run triage logic if not already done on device
    return {"status": "success", "message": "Report received", "report": report}

@app.get("/api/v1/cases")
def get_cases():
    # TODO: Fetch cases from database
    return {"cases": []}

@app.get("/api/v1/forecasts")
def get_forecasts(district: str):
    # TODO: Connect to LSTM predictions
    return {"district": district, "forecast": []}
