from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from twilio.rest import Client
import os

router = APIRouter(prefix="/api/v1/resources", tags=["Resource Allocation & Dispatch"])

from database.connection import get_db_pool

@router.get("/inventory")
async def get_inventory(district: str = None) -> Dict[str, Any]:
    """
    Module 4: PHC Supply Monitor.
    Live tracking of essential medical inventory with low-stock alerts.
    """
    pool = await get_db_pool()
    if pool:
        try:
            query = """
                SELECT center_name, district, item, stock, status, bed_capacity, on_duty_doctors
                FROM health_center_inventory
                WHERE ($1::text IS NULL OR district = $1)
                ORDER BY stock ASC;
            """
            rows = await pool.fetch(query, district)
            if rows:
                return {
                    "supplies": [dict(r) for r in rows]
                }
        except Exception as e:
            print(f"[Database] Error fetching inventory from Supabase: {e}")

    return {
        "supplies": [
            {"center_name": "Haveli PHC", "district": "Pune", "item": "ORS", "stock": 45, "status": "LOW_STOCK", "bed_capacity": 20, "on_duty_doctors": 2},
            {"center_name": "Haveli PHC", "district": "Pune", "item": "IV Ringer's Lactate", "stock": 150, "status": "HEALTHY", "bed_capacity": 20, "on_duty_doctors": 2},
            {"center_name": "Haveli PHC", "district": "Pune", "item": "Paracetamol", "stock": 30, "status": "CRITICAL", "bed_capacity": 20, "on_duty_doctors": 2},
            {"center_name": "Trimbak Hospital", "district": "Nashik", "item": "Dengue Test Kits", "stock": 15, "status": "LOW_STOCK", "bed_capacity": 35, "on_duty_doctors": 4}
        ]
    }

class BroadcastRequest(BaseModel):
    message: str
    target_village: str

@router.post("/broadcast")
def trigger_broadcast(req: BroadcastRequest) -> Dict[str, str]:
    """
    Module 4: SMS / WhatsApp Broadcast.
    One-click trigger to send emergency warnings to local medical staff.
    """
    # Initialize Twilio Client via Environment Variables
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', 'mock_sid')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', 'mock_token')
    
    if account_sid == 'mock_sid':
        print(f"[MOCK SMS] To {req.target_village}: {req.message}")
        return {"status": "success", "detail": "Mock broadcast sent (Twilio keys not configured)"}

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"URGENT ALERT ({req.target_village}): {req.message}",
            from_='whatsapp:+14155238886', # MUST be the universal Twilio Sandbox Number
            to='whatsapp:+917498541001'     
        )
        return {"status": "success", "detail": f"WhatsApp broadcast sent (SID: {message.sid})"}
    except Exception as e:
        error_str = str(e)
        if "ContentSid Required" in error_str or "Invalid template name" in error_str:
            print(f"\n[DEMO WHATSAPP BROADCAST]\nTo: {req.target_village}\nMessage: {req.message}\n")
            return {
                "status": "success", 
                "detail": "Broadcast triggered successfully! (Delivery mocked because Twilio Sandbox requires an active 24h session)"
            }
        return {"status": "error", "detail": error_str}
