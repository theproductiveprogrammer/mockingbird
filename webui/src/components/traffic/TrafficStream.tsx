import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { TrafficEntry } from './TrafficEntry';

export function TrafficStream() {
  const { traffic, setTraffic, filters, setSelectedTrafficId } = useAppStore();

  // Load initial traffic
  useEffect(() => {
    api.getTraffic(100).then(setTraffic);
  }, [setTraffic]);

  // Filter traffic
  const filteredTraffic = traffic.filter((entry) => {
    if (filters.length === 0) return true;

    return filters.every((filter) => {
      const lowerFilter = filter.toLowerCase();
      return (
        entry.method.toLowerCase().includes(lowerFilter) ||
        entry.path.toLowerCase().includes(lowerFilter) ||
        entry.service.toLowerCase().includes(lowerFilter) ||
        entry.rule_type.toLowerCase().includes(lowerFilter) ||
        entry.response?.status_code.toString().includes(filter)
      );
    });
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredTraffic.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg">No traffic yet</p>
            <p className="text-sm mt-2">Make a request to see it here</p>
          </div>
        </div>
      ) : (
        filteredTraffic.map((entry) => (
          <TrafficEntry
            key={entry.id}
            entry={entry}
            onClick={() => setSelectedTrafficId(entry.id)}
          />
        ))
      )}
    </div>
  );
}
