'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

export function GlobalAlerts() {
  useEffect(() => {
    // Mock websocket event emitter firing every 20s
    const interval = setInterval(() => {
      toast.error('Red-flag symptom logged', {
        description: 'A new high-risk symptom report was just received in Kipeto.',
        action: {
          label: 'View',
          onClick: () => console.log('Navigating to report...'),
        },
      });
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return <Toaster position="top-right" richColors />;
}
