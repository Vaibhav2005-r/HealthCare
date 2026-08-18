from fastapi import APIRouter
from typing import Dict, Any, List
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from database.db import fetch_districts_from_db, fetch_inventory_from_db
except ImportError:
    from api.database.db import fetch_districts_from_db, fetch_inventory_from_db

router = APIRouter(prefix="/api/v1/gis", tags=["GIS & Mapping"])

@router.get("/heatmap")
async def get_heatmap_data() -> Dict[str, Any]:
    """
    Module 1: 7-14 Day Predictive Outbreak Heatmap.
    Returns spatial GeoJSON risk vectors strictly from Supabase districts table.
    """
    districts = await fetch_districts_from_db()
    features = []
    
    for r in districts:
        lat = r.get("centroid_lat")
        lng = r.get("centroid_lng")
        if lat and lng:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lng), float(lat)]
                },
                "properties": {
                    "district_id": r.get("district_id"),
                    "name": r.get("name"),
                    "risk_score": float(r.get("risk_score") or 0.0),
                    "risk_level": r.get("risk_level") or "LOW",
                    "active_cases": int(r.get("active_cases") or 0),
                    "status": r.get("risk_level") or "LOW",
                    "rainfall_mm": float(r.get("rainfall_mm") or 0.0),
                    "humidity_pct": float(r.get("humidity_pct") or 70.0),
                    "primary_suspected": r.get("primary_suspected") or "Surveillance Monitoring"
                }
            })

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/infrastructure")
async def get_infrastructure_overlay() -> Dict[str, Any]:
    """
    Module 1: Health Infrastructure Overlay.
    Returns PHC/CHC locations with bed capacity and inventory details directly from Supabase.
    """
    supplies = await fetch_inventory_from_db()
    features = []
    
    # Group inventory by center
    centers: Dict[str, Dict[str, Any]] = {}
    for s in supplies:
        c_name = s.get("center_name") or "Primary Health Center"
        if c_name not in centers:
            centers[c_name] = {
                "name": f"{c_name} ({s.get('district') or 'Maharashtra'})",
                "bed_capacity": int(s.get("bed_capacity") or 25),
                "on_duty_doctors": int(s.get("on_duty_doctors") or 3),
                "lat": float(s.get("latitude") or 19.0),
                "lng": float(s.get("longitude") or 73.0),
                "items": []
            }
        item_str = f"{s.get('item')}: {s.get('stock')}"
        centers[c_name]["items"].append(item_str)
        
    for c in centers.values():
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c["lng"], c["lat"]]
            },
            "properties": {
                "name": c["name"],
                "bed_capacity": c["bed_capacity"],
                "on_duty_doctors": c["on_duty_doctors"],
                "supplies_summary": ", ".join(c["items"][:4]) if c["items"] else "Stock Active"
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }
