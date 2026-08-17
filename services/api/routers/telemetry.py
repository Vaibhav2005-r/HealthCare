from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any

router = APIRouter(prefix="/api/v1/telemetry", tags=["Field Telemetry Stream"])

# Simple connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

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
            # In production, the client mostly listens, but could send pings
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from database.connection import get_db_pool

@router.get("/logs")
async def get_telemetry_logs(district: str = None, status: str = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """
    Module 3: Real-Time Log Stream.
    Sortable, paginated table of incoming mobile logs with status tags from Supabase.
    """
    offset = (page - 1) * limit
    pool = await get_db_pool()
    if pool:
        try:
            query = """
                SELECT id::text as id, worker_identifier as worker_id, patient_name,
                       patient_age_years as patient_age, symptoms, severity as status,
                       sync_status as sync_method, reported_at::text, village, district
                FROM case_reports
                WHERE ($1::text IS NULL OR district = $1)
                  AND ($2::text IS NULL OR severity = $2)
                ORDER BY reported_at DESC
                LIMIT $3 OFFSET $4;
            """
            rows = await pool.fetch(query, district, status, limit, offset)
            if rows:
                return {
                    "page": page,
                    "limit": limit,
                    "count": len(rows),
                    "logs": [dict(r) for r in rows]
                }
        except Exception as e:
            print(f"[Database] Error querying telemetry logs: {e}")

    # Fallback mock telemetry logs if DB not connected
    mock_logs = [
        {
            "id": "rep-101",
            "worker_id": "ASHA-4029",
            "patient_age": 24,
            "symptoms": ["Fever", "Vomiting", "Severe Dehydration"],
            "status": "RED",
            "sync_method": "ONLINE",
            "reported_at": "2026-08-16T10:30:00Z",
            "village": "Haveli Center",
            "district": "Pune"
        },
        {
            "id": "rep-102",
            "worker_id": "ASHA-4030",
            "patient_age": 38,
            "symptoms": ["Joint Pain", "High Fever", "Eye Pain"],
            "status": "AMBER",
            "sync_method": "ONLINE",
            "reported_at": "2026-08-16T09:15:00Z",
            "village": "Trimbak Subcenter",
            "district": "Nashik"
        },
        {
            "id": "rep-103",
            "worker_id": "ASHA-4031",
            "patient_age": 12,
            "symptoms": ["Mild Cough", "Runny Nose"],
            "status": "GREEN",
            "sync_method": "ONLINE",
            "reported_at": "2026-08-16T08:45:00Z",
            "village": "Bhiwandi Ward 4",
            "district": "Thane"
        }
    ]
    return {
        "page": page,
        "limit": limit,
        "count": len(mock_logs),
        "logs": mock_logs
    }
