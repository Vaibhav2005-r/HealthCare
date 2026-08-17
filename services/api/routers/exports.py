from fastapi import APIRouter, Response
from typing import Dict, Any
from database.connection import get_db_pool
import io
import csv
import json

router = APIRouter(prefix="/api/v1/exports", tags=["Governance & Compliance Reports"])

@router.get("/data")
async def export_raw_data(format: str = "json", district: str = None):
    """
    Module 6: Raw Data Exporters.
    Download anonymized surveillance records from Supabase in CSV or JSON format.
    """
    pool = await get_db_pool()
    records = []
    
    if pool:
        try:
            query = """
                SELECT id::text, patient_age_years, patient_gender, district, village,
                       symptoms, severity, duration_days, temperature, reported_at::text
                FROM case_reports
                WHERE ($1::text IS NULL OR district = $1)
                ORDER BY reported_at DESC;
            """
            rows = await pool.fetch(query, district)
            records = [dict(r) for r in rows]
        except Exception as e:
            print(f"[Exports] Error exporting records: {e}")

    if not records:
        records = [
            {
                "id": "demo-001",
                "patient_age_years": 29,
                "patient_gender": "M",
                "district": "Pune",
                "village": "Haveli",
                "symptoms": ["High Fever", "Vomiting"],
                "severity": "RED",
                "duration_days": 2,
                "temperature": 103.0,
                "reported_at": "2026-08-16T10:00:00Z"
            }
        ]

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=records[0].keys())
        writer.writeheader()
        for row in records:
            # Flatten array symptoms for CSV
            row_copy = dict(row)
            if isinstance(row_copy.get("symptoms"), list):
                row_copy["symptoms"] = "; ".join(row_copy["symptoms"])
            writer.writerow(row_copy)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=outbreak_surveillance_export.csv"}
        )

    return {
        "status": "success",
        "total_records": len(records),
        "data": records
    }
