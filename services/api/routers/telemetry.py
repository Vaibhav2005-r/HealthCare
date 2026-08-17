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

@router.get("/logs")
def get_telemetry_logs(district: str = None, status: str = None, page: int = 1) -> Dict[str, Any]:
    """
    Module 3: Real-Time Log Stream.
    Sortable, paginated table of incoming mobile logs with status tags.
    """
    return {
        "page": page,
        "logs": [
            {
                "id": 101,
                "worker_id": "ASHA-001",
                "patient_age": 24,
                "symptoms": ["Fever", "Vomiting"],
                "status": "RED",
                "sync_method": "ONLINE",
                "reported_at": "2026-08-15T10:30:00Z"
            }
        ]
    }
