from fastapi import APIRouter
from typing import Dict, Any, List, Optional
import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from database.db import (
        fetch_state_case_history_from_db, 
        fetch_district_case_history_from_db,
        fetch_districts_from_db,
        fetch_case_reports_from_db
    )
except ImportError:
    from api.database.db import (
        fetch_state_case_history_from_db, 
        fetch_district_case_history_from_db,
        fetch_districts_from_db,
        fetch_case_reports_from_db
    )

router = APIRouter(prefix="/api/v1/analytics", tags=["Outbreak Analytics"])

@router.get("/trends")
async def get_trends(district_id: Optional[str] = None, district: Optional[str] = None, days: int = 14) -> Dict[str, Any]:
    """
    Module 2: Multi-Axis Time-Series Plotter with District-Level Analytics & ML Forecast.
    Returns historical cases vs weather metrics strictly from Supabase district_case_history.
    """
    target_id = district_id or district
    try:
        districts = await fetch_districts_from_db()
        matched = None
        if target_id:
            matched = next(
                (d for d in districts if d.get("district_id") == target_id or d.get("name", "").lower() == target_id.lower()),
                None
            )
            
        if matched:
            d_id = matched.get("district_id")
            d_name = matched.get("name")
            current_cases = int(matched.get("active_cases") or 10)
            lat = float(matched.get("centroid_lat") or 19.0)
            lng = float(matched.get("centroid_lng") or 75.0)
            
            # Fetch district specific genuine 14-day history from Supabase
            history = await fetch_district_case_history_from_db(d_id, days=days)
            try:
                from ml.nvidia_fourcastnet_engine import run_simultaneous_fourcastnet_lstm_forecast
                forecast_res = await run_simultaneous_fourcastnet_lstm_forecast(
                    district_id=d_id,
                    district_name=d_name,
                    lat=lat,
                    lng=lng,
                    current_cases=current_cases,
                    history_rows=history,
                    forecast_days=14
                )
            except Exception as ml_err:
                print(f"[Analytics] ML forecast fallback: {ml_err}")
                forecast_res = {"forecast_trajectory": []}
            
            data = []
            for r in history:
                rec_date = r.get("record_date")
                date_str = rec_date.isoformat() if hasattr(rec_date, "isoformat") else str(rec_date)
                data.append({
                    "date": date_str,
                    "actual_cases": int(r.get("cases_reported") or 0),
                    "predicted_cases": None,
                    "precip_mm": float(r.get("rainfall_mm") or 0.0),
                    "temp_c": float(r.get("temp_c") or 27.5),
                    "humidity": float(r.get("humidity_pct") or 75.0),
                    "is_forecast": False
                })
                
            # Append forward 14-day predictions
            for f in forecast_res.get("forecast_trajectory", []):
                data.append({
                    "date": f.get("date"),
                    "actual_cases": None,
                    "predicted_cases": f.get("predicted_cases"),
                    "lower_bound": f.get("lower_bound_cases"),
                    "upper_bound": f.get("upper_bound_cases"),
                    "precip_mm": f.get("fourcastnet_rainfall_mm"),
                    "temp_c": f.get("temp_c"),
                    "humidity": f.get("humidity_pct"),
                    "vector_breeding_risk": f.get("vector_breeding_risk"),
                    "risk_score": f.get("risk_score"),
                    "risk_level": f.get("risk_level"),
                    "is_forecast": True
                })
                
            return {
                "district_id": d_id,
                "district_name": d_name,
                "source": "Supabase PostgreSQL + NVIDIA FourCastNet + PyTorch LSTM",
                "data": data,
                "summary": {
                    "baseline_active_cases": current_cases,
                    "peak_predicted_cases": max((f.get("predicted_cases", 0) for f in forecast_res.get("forecast_trajectory", [])), default=current_cases),
                    "max_rain_forecast": max((f.get("fourcastnet_rainfall_mm", 0) for f in forecast_res.get("forecast_trajectory", [])), default=0.0)
                }
            }
        else:
            # Statewide aggregated trend from Supabase
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
                    "temp_c": float(r.get("temp_c") or 27.5),
                    "humidity": float(r.get("humidity_pct") or 75.0),
                    "is_forecast": False
                })
            return {
                "district_id": "STATEWIDE",
                "district_name": "Maharashtra (All 36 Districts)",
                "source": "Supabase PostgreSQL (district_case_history)",
                "data": data
            }
    except Exception as e:
        print(f"[Analytics] Error fetching trends from DB: {e}")
        return {
            "district_id": target_id or "STATEWIDE",
            "district_name": "Maharashtra",
            "source": "Supabase PostgreSQL",
            "data": []
        }

@router.get("/demographics")
async def get_demographics() -> Dict[str, Any]:
    """
    Module 2: Demographic Breakdown.
    Categorizes patient risk by age brackets and symptom clusters strictly from Supabase case_reports.
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

        return {
            "source": "Supabase PostgreSQL (case_reports)",
            "total_intake_records": len(reports),
            "age_brackets": age_brackets,
            "symptom_clusters": symptom_clusters
        }
    except Exception as e:
        print(f"[Analytics] Error fetching demographics from DB: {e}")
        return {
            "source": "Supabase PostgreSQL (case_reports)",
            "total_intake_records": 0,
            "age_brackets": {"<5 yrs": 0, "5-18": 0, "18-60": 0, "60+": 0},
            "symptom_clusters": {}
        }
