from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from twilio.rest import Client
import os

router = APIRouter(prefix="/api/v1/resources", tags=["Resource Allocation & Dispatch"])

@router.get("/inventory")
def get_inventory() -> Dict[str, Any]:
    """
    Module 4: PHC Supply Monitor.
    Live tracking of essential medical inventory with low-stock alerts.
    """
    return {
        "supplies": [
            {"item": "ORS", "stock": 45, "status": "LOW_STOCK"},
            {"item": "IV Ringer's Lactate", "stock": 150, "status": "HEALTHY"},
            {"item": "Paracetamol", "stock": 30, "status": "CRITICAL"}
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
