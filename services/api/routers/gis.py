from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/api/v1/gis", tags=["GIS & Mapping"])

@router.get("/heatmap")
def get_heatmap_data() -> Dict[str, Any]:
    """
    Module 1: 7-14 Day Predictive Outbreak Heatmap.
    Returns spatial risk vectors integrated with the LSTM backend.
    """
    # Mock data representing the GeoJSON expected by Leaflet
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [72.8777, 19.0760]},
                "properties": {"risk_score": 0.85, "status": "RED"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8567, 18.5204]},
                "properties": {"risk_score": 0.45, "status": "AMBER"}
            }
        ]
    }

@router.get("/infrastructure")
def get_infrastructure_overlay() -> Dict[str, Any]:
    """
    Module 1: Health Infrastructure Overlay.
    Returns PHC/CHC locations with bed capacity and inventory details.
    """
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [72.9, 19.1]},
                "properties": {
                    "name": "District PHC Mumbai",
                    "bed_capacity": 50,
                    "ors_stock": 200,
                    "on_duty_doctors": 5
                }
            }
        ]
    }
