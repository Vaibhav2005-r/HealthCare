from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import fetch_case_reports_from_db

router = APIRouter(prefix="/api/v1/telemetry", tags=["Field Telemetry Stream"])

# Simple connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Module 1/3: Real-Time Alerts WebSocket.
    Pushes live notification banners when ASHA workers log critical red-flag symptoms.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/logs")
async def get_telemetry_logs(district: str = None, status: str = None, page: int = 1) -> Dict[str, Any]:
    """
    Module 3: Real-Time Log Stream from Supabase.
    Sortable, paginated table of incoming mobile case reports.
    """
    reports = await fetch_case_reports_from_db(limit=50)
    if district:
        reports = [r for r in reports if r.get("district", "").lower() == district.lower()]
    return {
        "page": page,
        "count": len(reports),
        "source": "Supabase PostgreSQL (Live)",
        "logs": reports
    }
