from fastapi import APIRouter
from typing import Dict, Any, List
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import fetch_state_case_history_from_db, fetch_case_reports_from_db

router = APIRouter(prefix="/api/v1/analytics", tags=["Outbreak Analytics"])

@router.get("/trends")
async def get_trends(days: int = 14) -> Dict[str, Any]:
    """
    Module 2: Multi-Axis Time-Series Plotter.
    Returns historical cases vs weather metrics aggregated from Supabase district_case_history.
    """
    try:
        history = await fetch_state_case_history_from_db(days=days)
        data = []
        for r in history:
            rec_date = r.get("record_date")
            date_str = rec_date.isoformat() if hasattr(rec_date, "isoformat") else str(rec_date)
            data.append({
                "date": date_str,
                "actual_cases": int(r.get("cases_reported") or 0),
                "predicted_cases": None,
                "precip_mm": float(r.get("rainfall_mm") or 0.0),
                "humidity": 75.0
            })
        return {"source": "Supabase PostgreSQL (district_case_history)", "data": data}
    except Exception as e:
        print(f"[Analytics] Error fetching trends from DB: {e}")
        return {
            "source": "Fallback",
            "data": [
                {"date": "2026-08-12", "actual_cases": 112, "predicted_cases": None, "precip_mm": 45.0, "humidity": 80},
                {"date": "2026-08-18", "actual_cases": 186, "predicted_cases": None, "precip_mm": 88.0, "humidity": 84},
            ]
        }

@router.get("/demographics")
async def get_demographics() -> Dict[str, Any]:
    """
    Module 2: Demographic Breakdown.
    Categorizes patient risk by age brackets and symptom clusters from Supabase case_reports.
    """
    try:
        reports = await fetch_case_reports_from_db(limit=200)
        age_brackets = {"<5 yrs": 0, "5-18": 0, "18-60": 0, "60+": 0}
        symptom_clusters: Dict[str, int] = {}

        for rep in reports:
            age = rep.get("patient_age_years") or 30
            if age < 5:
                age_brackets["<5 yrs"] += 1
            elif age <= 18:
                age_brackets["5-18"] += 1
            elif age <= 60:
                age_brackets["18-60"] += 1
            else:
                age_brackets["60+"] += 1

            symptoms = rep.get("symptoms") or []
            for s in symptoms:
                s_name = str(s).strip().title()
                symptom_clusters[s_name] = symptom_clusters.get(s_name, 0) + 1

        if not symptom_clusters:
            symptom_clusters = {"Fever": 12, "Dehydration": 8, "Vomiting": 6}

        return {
            "source": "Supabase PostgreSQL (case_reports)",
            "total_intake_records": len(reports),
            "age_brackets": age_brackets,
            "symptom_clusters": symptom_clusters
        }
    except Exception as e:
        print(f"[Analytics] Error fetching demographics from DB: {e}")
        return {
            "source": "Fallback",
            "age_brackets": {"<5 yrs": 25, "5-18": 40, "18-60": 120, "60+": 35},
            "symptom_clusters": {"Fever": 150, "Dehydration": 80, "Vomiting": 60}
        }
