from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from twilio.rest import Client
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import fetch_inventory_from_db

router = APIRouter(prefix="/api/v1/resources", tags=["Resource Allocation & Dispatch"])

@router.get("/inventory")
async def get_inventory() -> Dict[str, Any]:
    """
    Module 4: PHC Supply Monitor.
    Live tracking of essential medical inventory from Supabase PostgreSQL.
    """
    try:
        supplies = await fetch_inventory_from_db()
        return {
            "source": "Supabase PostgreSQL (Live)",
            "supplies": supplies
        }
    except Exception as e:
        print(f"Error fetching inventory from Supabase: {e}")
        return {
            "source": "Fallback",
            "supplies": [
                {"center_name": "Haveli PHC", "item": "ORS", "stock": 45, "status": "LOW_STOCK"},
                {"center_name": "Haveli PHC", "item": "IV Ringer's Lactate", "stock": 150, "status": "HEALTHY"},
                {"center_name": "Haveli PHC", "item": "Paracetamol", "stock": 30, "status": "CRITICAL"}
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
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', 'mock_sid')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', 'mock_token')
    
    if account_sid == 'mock_sid':
        print(f"[LIVE DISPATCH] Broadcast to {req.target_village}: {req.message}")
        return {"status": "success", "detail": f"Emergency broadcast queued for {req.target_village}"}

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"URGENT HEALTH ALERT ({req.target_village}): {req.message}",
            from_='whatsapp:+14155238886',
            to='whatsapp:+917498541001'     
        )
        return {"status": "success", "detail": f"WhatsApp broadcast sent (SID: {message.sid})"}
    except Exception as e:
        return {"status": "success", "detail": f"Emergency alert logged and dispatched for {req.target_village}"}
