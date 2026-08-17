from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/analytics", tags=["Outbreak Analytics"])

@router.get("/trends")
def get_trends() -> Dict[str, Any]:
    """
    Module 2: Multi-Axis Time-Series Plotter.
    Returns historical cases vs predicted incidence + weather metrics.
    """
    return {
        "data": [
            {"date": "2026-08-01", "actual_cases": 12, "predicted_cases": 15, "precip_mm": 10.5, "humidity": 80},
            {"date": "2026-08-02", "actual_cases": 18, "predicted_cases": 16, "precip_mm": 12.0, "humidity": 82},
        ]
    }

@router.get("/demographics")
def get_demographics() -> Dict[str, Any]:
    """
    Module 2: Demographic Breakdown.
    Categorizes patient risk by age brackets and symptom clusters.
    """
    return {
        "age_brackets": {
            "<5 yrs": 25,
            "5-18": 40,
            "18-60": 120,
            "60+": 35
        },
        "symptom_clusters": {
            "Fever": 150,
            "Dehydration": 80,
            "Vomiting": 60
        }
    }
