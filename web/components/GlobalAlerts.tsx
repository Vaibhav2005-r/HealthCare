'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Radio } from 'lucide-react';

export function GlobalAlerts() {
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8001/ws/telemetry');

        ws.onopen = () => {
          console.log('[WebSocket] Connected to Arogya Prahari realtime telemetry stream');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'NEW_SOS_ALERT') {
              const alert = data.alert;
              toast.error(`CRITICAL SOS: ${alert.district}`, {
                description: alert.summary,
                duration: 8000,
                icon: <AlertCircle className="w-5 h-5 text-red-500" />,
              });
            } else if (data.type === 'NEW_FIELD_REPORT') {
              toast.info(`New Field Report: ${data.district || 'ASHA Telemetry'}`, {
                description: `Worker ${data.worker_id} logged symptoms: ${data.symptoms ? data.symptoms.join(', ') : 'New Case'}.`,
                duration: 5000,
                icon: <Radio className="w-4 h-4 text-blue-500" />,
              });
            }
          } catch (e) {
            console.error('Error parsing telemetry message', e);
          }
        };

        ws.onerror = (error) => {
          console.warn('[WebSocket] Telemetry stream error', error);
        };

        ws.onclose = () => {
          // Attempt auto-reconnect every 5 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return null;
}
