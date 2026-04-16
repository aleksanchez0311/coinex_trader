import asyncio
import json
from typing import List, Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = set()
        print(f">>> New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
        print(f">>> WebSocket disconnected. Total: {len(self.active_connections)}")

    async def subscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self.subscriptions:
            self.subscriptions[websocket].update(symbols)
            print(f">>> Client subscribed to: {symbols}")

    async def broadcast_to_subscribers(self, symbol: str, data: dict):
        message = json.dumps({"type": "ticker", "symbol": symbol, "data": data})
        for websocket, subs in self.subscriptions.items():
            if symbol in subs or "ALL" in subs:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    print(f">>> Error broadcasting to websocket: {e}")
                    # Limpieza preventiva se hace en el try-except del main loop

manager = ConnectionManager()
