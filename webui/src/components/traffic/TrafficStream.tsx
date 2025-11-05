import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { TrafficEntry } from './TrafficEntry';

export function TrafficStream() {
  const { traffic, setTraffic, addTraffic, filters, selectedServices, setIsConnected } = useAppStore();

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

  // Filter traffic: first by selected services, then by text filters
  const filteredTraffic = traffic.filter((entry) => {
    // First check: is the service selected?
    if (selectedServices.size > 0 && !selectedServices.has(entry.service)) {
      return false; // Service is deselected, hide this entry
    }

    // Second check: apply text filters
    if (filters.length === 0) return true;

    // Entry must match ALL filters (AND logic)
    return filters.every((filter) => {
      // Parse filter type
      let isNegative = false;
      let actualFilter = filter;

      // Check for negative filter (prefix with -)
      if (filter.startsWith('-')) {
        isNegative = true;
        actualFilter = filter.substring(1);
        if (!actualFilter) return true; // Empty filter after '-' matches everything
      }

      let matches = false;

      // Check for regex filter (/pattern/)
      // But be forgiving: if it looks like a URL path (e.g., /users/create/), treat it as URL-only
      if (actualFilter.startsWith('/') && actualFilter.endsWith('/') && actualFilter.length > 2) {
        const content = actualFilter.substring(1, actualFilter.length - 1);

        // Heuristic: if content has internal slashes and no regex special chars, it's probably a URL path
        const hasInternalSlashes = content.includes('/');
        const hasRegexChars = /[\\^$*+?()[\]{}|]/.test(content);
        const isLikelyUrlPath = hasInternalSlashes && !hasRegexChars;

        if (isLikelyUrlPath) {
          // Treat as URL-only filter (remove trailing slash)
          matches = entry.path.toLowerCase().includes(content.toLowerCase());
        } else {
          // Treat as regex
          try {
            const regex = new RegExp(content, 'i');

            // Test against all searchable fields
            const pathMatch = regex.test(entry.path);

            const queryString = Object.entries(entry.query || {})
              .map(([key, values]) => `${key}=${values.join(',')}`)
              .join('&');
            const queryMatch = regex.test(queryString);

            const requestBody = typeof entry.body === 'string'
              ? entry.body
              : JSON.stringify(entry.body || '');
            const requestMatch = regex.test(requestBody);

            const responseMatch = entry.response?.body ? regex.test(entry.response.body) : false;

            matches = pathMatch || queryMatch || requestMatch || responseMatch;
          } catch (e) {
            // Invalid regex, no match
            matches = false;
          }
        }
      }
      // Check for URL-only filter (starts with / but doesn't end with /)
      else if (actualFilter.startsWith('/')) {
        matches = entry.path.toLowerCase().includes(actualFilter.toLowerCase());
      }
      // Plain text search across all fields
      else {
        const lowerFilter = actualFilter.toLowerCase();

        // Match against path/URL
        if (entry.path.toLowerCase().includes(lowerFilter)) {
          matches = true;
        } else {
          // Match against query params
          const queryString = Object.entries(entry.query || {})
            .map(([key, values]) => `${key}=${values.join(',')}`)
            .join('&')
            .toLowerCase();
          if (queryString.includes(lowerFilter)) {
            matches = true;
          } else {
            // Match against request body
            const requestBody = typeof entry.body === 'string'
              ? entry.body
              : JSON.stringify(entry.body || '');
            if (requestBody.toLowerCase().includes(lowerFilter)) {
              matches = true;
            } else if (entry.response?.body &&
                entry.response.body.toLowerCase().includes(lowerFilter)) {
              // Match against response body
              matches = true;
            }
          }
        }
      }

      // Return inverted match if negative filter
      return isNegative ? !matches : matches;
    });
  });

  // Debug: log when filters or services change
  if (filters.length > 0 || selectedServices.size < serviceCount()) {
    const deselected = Array.from(new Set(traffic.map(e => e.service))).filter(s => !selectedServices.has(s));
    console.log('Filters:', filters, '| Deselected services:', deselected, '| Total:', traffic.length, '| Filtered:', filteredTraffic.length);
  }

  function serviceCount() {
    return new Set(traffic.map(e => e.service)).size;
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
