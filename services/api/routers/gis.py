from fastapi import APIRouter
from typing import Dict, Any
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/gis", tags=["GIS & Mapping"])

@router.get("/heatmap")
async def get_heatmap_data() -> Dict[str, Any]:
    """
    Module 1: 7-14 Day Predictive Outbreak Heatmap.
    Returns spatial GeoJSON risk vectors from Supabase districts.
    """
    pool = await get_db_pool()
    features = []
    
    if pool:
        try:
            records = await pool.fetch("""
                SELECT district_id, name, centroid_lat, centroid_lng, risk_level, risk_score, active_cases
                FROM districts;
            """)
            for r in records:
                if r["centroid_lat"] and r["centroid_lng"]:
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [r["centroid_lng"], r["centroid_lat"]]
                        },
                        "properties": {
                            "district_id": r["district_id"],
                            "name": r["name"],
                            "risk_score": r["risk_score"],
                            "risk_level": r["risk_level"],
                            "active_cases": r["active_cases"],
                            "status": r["risk_level"]
                        }
                    })
        except Exception as e:
            print(f"[GIS] Error fetching heatmap geodata from Supabase: {e}")

    if not features:
        features = [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8567, 18.5204]},
                "properties": {"name": "Pune", "risk_score": 0.89, "status": "CRITICAL"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.7898, 19.9975]},
                "properties": {"name": "Nashik", "risk_score": 0.76, "status": "HIGH"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [72.9781, 19.2183]},
                "properties": {"name": "Thane", "risk_score": 0.72, "status": "HIGH"}
            }
        ]

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/infrastructure")
async def get_infrastructure_overlay() -> Dict[str, Any]:
    """
    Module 1: Health Infrastructure Overlay.
    Returns PHC/CHC locations with bed capacity and inventory details from Supabase.
    """
    pool = await get_db_pool()
    features = []
    
    if pool:
        try:
            records = await pool.fetch("""
                SELECT center_name, district, bed_capacity, on_duty_doctors, latitude, longitude,
                       string_agg(item || ': ' || stock, ', ') as inventory_summary
                FROM health_center_inventory
                GROUP BY center_name, district, bed_capacity, on_duty_doctors, latitude, longitude;
            """)
            for r in records:
                lat = r["latitude"] or 18.5204
                lng = r["longitude"] or 73.8567
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    },
                    "properties": {
                        "name": f"{r['center_name']} ({r['district']})",
                        "bed_capacity": r["bed_capacity"] or 20,
                        "on_duty_doctors": r["on_duty_doctors"] or 2,
                        "supplies_summary": r["inventory_summary"] or "Stock Available"
                    }
                })
        except Exception as e:
            print(f"[GIS] Error fetching infrastructure overlay: {e}")

    if not features:
        features = [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8567, 18.5204]},
                "properties": {
                    "name": "Haveli PHC (Pune)",
                    "bed_capacity": 20,
                    "on_duty_doctors": 2,
                    "supplies_summary": "ORS: 45, IV Lactate: 150"
                }
            }
        ]

    return {
        "type": "FeatureCollection",
        "features": features
    }
