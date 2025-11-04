import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { api } from '../utils/api';
import { TrafficEntry } from '../types/api';

export function useTrafficSSE() {
  const { addTraffic, setIsConnected } = useAppStore();

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource(api.getTrafficStreamUrl());

      eventSource.onopen = () => {
        console.log('SSE Connected');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const entry: TrafficEntry = JSON.parse(event.data);
          addTraffic(entry);
        } catch (error) {
          console.error('Failed to parse traffic entry:', error);
        }
      };

      eventSource.onerror = () => {
        console.error('SSE Error, reconnecting...');
        setIsConnected(false);
        eventSource?.close();

        // Reconnect after 2 seconds
        setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, [addTraffic, setIsConnected]);
}
