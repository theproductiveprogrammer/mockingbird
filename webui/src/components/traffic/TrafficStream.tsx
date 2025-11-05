import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { TrafficEntry } from './TrafficEntry';

export function TrafficStream() {
  const { traffic, setTraffic, addTraffic, filters, setIsConnected } = useAppStore();

  // Load initial traffic and setup SSE
  useEffect(() => {
    // Load initial traffic
    api.getTraffic(100).then(setTraffic);

    // Setup SSE connection for live updates
    const eventSource = new EventSource(api.getTrafficStreamUrl());

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data);
        addTraffic(entry);
      } catch (error) {
        console.error('Failed to parse traffic entry:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [setTraffic, addTraffic, setIsConnected]);

  // Filter traffic with AND logic
  const filteredTraffic = traffic.filter((entry) => {
    if (filters.length === 0) return true;

    // Entry must match ALL filters (AND logic)
    // Each filter can match: path (URL), request body, response body, or query params
    return filters.every((filter) => {
      const lowerFilter = filter.toLowerCase();

      // Match against path/URL
      if (entry.path.toLowerCase().includes(lowerFilter)) return true;

      // Match against query params
      const queryString = Object.entries(entry.query || {})
        .map(([key, values]) => `${key}=${values.join(',')}`)
        .join('&')
        .toLowerCase();
      if (queryString.includes(lowerFilter)) return true;

      // Match against request body
      const requestBody = typeof entry.body === 'string'
        ? entry.body
        : JSON.stringify(entry.body || '');
      if (requestBody.toLowerCase().includes(lowerFilter)) return true;

      // Match against response body
      if (entry.response?.body &&
          entry.response.body.toLowerCase().includes(lowerFilter)) return true;

      return false;
    });
  });

  // Debug: log when filters change
  if (filters.length > 0) {
    console.log('Filters:', filters, '| Total:', traffic.length, '| Filtered:', filteredTraffic.length);
  }

  return (
    <div className="h-full overflow-y-auto">
      {filteredTraffic.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-600">
          <div className="text-center">
            <p className="text-sm font-normal">No traffic yet</p>
            <p className="text-xs mt-1 text-gray-500">Make a request to see it here</p>
          </div>
        </div>
      ) : (
        filteredTraffic.map((entry) => (
          <TrafficEntry key={entry.id} entry={entry} />
        ))
      )}
    </div>
  );
}
