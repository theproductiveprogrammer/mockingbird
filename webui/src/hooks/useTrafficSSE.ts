import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { api } from '../utils/api';
import { TrafficEntry } from '../types/api';

export function useTrafficSSE() {
  const { addTraffic, setIsConnected } = useAppStore();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

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
          // Ensure connected state is true when receiving messages
          setIsConnected(true);
        } catch (error) {
          console.error('Failed to parse traffic entry:', error);
        }
      };

      eventSource.onerror = () => {
        console.error('SSE Error, reconnecting...');
        setIsConnected(false);
        eventSource?.close();

        // Reconnect after 2 seconds
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      eventSource?.close();
    };
  }, [addTraffic, setIsConnected]);
}
