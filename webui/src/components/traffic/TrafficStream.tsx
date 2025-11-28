import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../stores/appStore";
import { api } from "../../utils/api";
import { TrafficEntry } from "./TrafficEntry";

export function TrafficStream() {
  const {
    traffic,
    totalAvailable,
    newEntryIds,
    unseenCount,
    clearedBeforeTimestamp,
    setTraffic,
    loadMoreTraffic,
    clearUnseenCount,
    filters,
    selectedServices,
    workspaceBirdIcon,
  } = useAppStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearTop, setIsNearTop] = useState(true);
  const previousTrafficLength = useRef(traffic.length);

  // Load initial traffic on mount
  useEffect(() => {
    if (traffic.length === 0) {
      console.log("[TrafficStream] Loading initial traffic");
      api.getTraffic(100).then((result) => {
        setTraffic(result.entries, result.total);
      });
    }
  }, []);

  // Track scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const nearTop = scrollTop < 100; // Consider "near top" if within 100px
      setIsNearTop(nearTop);

      // Clear unseen count when user scrolls to top
      if (nearTop && unseenCount > 0) {
        clearUnseenCount();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [unseenCount, clearUnseenCount]);

  // Auto-scroll to top when new entries arrive (only if already near top)
  useEffect(() => {
    if (traffic.length > previousTrafficLength.current && isNearTop) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    previousTrafficLength.current = traffic.length;
  }, [traffic.length, isNearTop]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    clearUnseenCount();
  };

  // Convert clear timestamp to Date for proper comparison (handles timezone differences)
  const clearDate = clearedBeforeTimestamp ? new Date(clearedBeforeTimestamp).getTime() : null;

  // Filter traffic: by clear timestamp, selected services, then by text filters
  const filteredTraffic = traffic.filter((entry) => {
    // First check: is it after the clear timestamp?
    if (clearDate && new Date(entry.timestamp).getTime() <= clearDate) {
      return false; // Entry is at or before the clear marker, hide it
    }

    // Second check: is the service selected?
    if (selectedServices.size > 0 && !selectedServices.has(entry.service)) {
      return false; // Service is deselected, hide this entry
    }

    // Third check: apply text filters
    if (filters.length === 0) return true;

    // Entry must match ALL filters (AND logic)
    return filters.every((filter) => {
      // Parse filter type
      let isNegative = false;
      let actualFilter = filter;

      // Check for negative filter (prefix with -)
      if (filter.startsWith("-")) {
        isNegative = true;
        actualFilter = filter.substring(1);
        if (!actualFilter) return true; // Empty filter after '-' matches everything
      }

      let matches = false;

      // Check for regex filter (/pattern/)
      // But be forgiving: if it looks like a URL path (e.g., /users/create/), treat it as URL-only
      if (
        actualFilter.startsWith("/") &&
        actualFilter.endsWith("/") &&
        actualFilter.length > 2
      ) {
        const content = actualFilter.substring(1, actualFilter.length - 1);

        // Heuristic: if content has internal slashes and no regex special chars, it's probably a URL path
        const hasInternalSlashes = content.includes("/");
        const hasRegexChars = /[\\^$*+?()[\]{}|]/.test(content);
        const isLikelyUrlPath = hasInternalSlashes && !hasRegexChars;

        if (isLikelyUrlPath) {
          // Treat as URL-only filter (remove trailing slash)
          matches = entry.path.toLowerCase().includes(content.toLowerCase());
        } else {
          // Treat as regex
          try {
            const regex = new RegExp(content, "i");

            // Test against all searchable fields
            const pathMatch = regex.test(entry.path);

            const queryString = Object.entries(entry.query || {})
              .map(([key, values]) => `${key}=${values.join(",")}`)
              .join("&");
            const queryMatch = regex.test(queryString);

            const requestBody =
              typeof entry.body === "string"
                ? entry.body
                : JSON.stringify(entry.body || "");
            const requestMatch = regex.test(requestBody);

            const responseMatch = entry.response?.body
              ? regex.test(entry.response.body)
              : false;

            matches = pathMatch || queryMatch || requestMatch || responseMatch;
          } catch (e) {
            // Invalid regex, no match
            matches = false;
          }
        }
      }
      // Check for URL-only filter (starts with / but doesn't end with /)
      else if (actualFilter.startsWith("/")) {
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
            .map(([key, values]) => `${key}=${values.join(",")}`)
            .join("&")
            .toLowerCase();
          if (queryString.includes(lowerFilter)) {
            matches = true;
          } else {
            // Match against request body
            const requestBody =
              typeof entry.body === "string"
                ? entry.body
                : JSON.stringify(entry.body || "");
            if (requestBody.toLowerCase().includes(lowerFilter)) {
              matches = true;
            } else if (
              entry.response?.body &&
              entry.response.body.toLowerCase().includes(lowerFilter)
            ) {
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

  // Debug: log traffic count on every render
  console.log(
    "[TrafficStream] Render - Total traffic:",
    traffic.length,
    "| Filtered:",
    filteredTraffic.length,
  );

  const hasMore = traffic.length < totalAvailable;

  // Helper function to check if we should show a time divider
  const shouldShowTimeDivider = (
    currentEntry: any,
    previousEntry: any,
  ): boolean => {
    if (!previousEntry) return true;

    const currentTime = new Date(currentEntry.timestamp).getTime();
    const previousTime = new Date(previousEntry.timestamp).getTime();
    const diffInSeconds = Math.abs(currentTime - previousTime) / 1000;

    return diffInSeconds >= 5;
  };

  // Helper function to format timestamp for divider
  const formatDividerTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="h-full relative">
      {/* Sticky banner for new messages when scrolled down */}
      {!isNearTop && unseenCount > 0 && (
        <div
          onClick={scrollToTop}
          className="absolute top-0 left-0 right-0 z-10 bg-blue-500 text-white text-center py-2 text-sm cursor-pointer hover:bg-blue-600 transition-colors"
        >
          {unseenCount} new message{unseenCount > 1 ? "s" : ""} ↑
        </div>
      )}

      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
        {filteredTraffic.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <div className="text-center">
              {clearedBeforeTimestamp ? (
                <>
                  <p className="text-sm font-normal">No traffic shown</p>
                  <p className="text-xs mt-1 text-gray-500">
                    Make a request to see it here
                  </p>
                </>
              ) : traffic.length > 0 || filters.length > 0 || selectedServices.size > 0 ? (
                <>
                  <p className="text-sm font-normal">No matches found</p>
                  <p className="text-xs mt-1 text-gray-500">
                    {hasMore ? 'Try adjusting filters or load more traffic' : 'Try adjusting your filters'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-normal">No traffic yet</p>
                  <p className="text-xs mt-1 text-gray-500">
                    Make a request to see it here
                  </p>
                </>
              )}
            </div>

            {/* Load More button when filtering shows no results but more traffic exists (not when cleared) */}
            {hasMore && !clearedBeforeTimestamp && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {workspaceBirdIcon && (
                  <img
                    src={`/img/w/${workspaceBirdIcon}`}
                    alt="Workspace"
                    className="w-5 h-5"
                  />
                )}
                <button
                  onClick={loadMoreTraffic}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
                >
                  Load 100 More (showing {traffic.length} of {totalAvailable})
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {filteredTraffic.map((entry, index) => {
              const previousEntry =
                index > 0 ? filteredTraffic[index - 1] : null;
              const showDivider = shouldShowTimeDivider(entry, previousEntry);

              return (
                <div key={entry.id}>
                  {showDivider && (
                    <div className="flex items-center justify-center pb-4 pt-8 text-xs text-black-700">
                      {/*<div className="border-t border-gray-200 w-8"></div>*/}
                      <span className="text-gray-600">• </span>
                      <span className="px-3 flex-shrink-0 text-gray-700">
                        {formatDividerTime(entry.timestamp)}
                      </span>
                      <span className="text-gray-600"> •</span>
                    </div>
                  )}
                  <TrafficEntry
                    entry={entry}
                    isNew={newEntryIds.has(entry.id)}
                  />
                </div>
              );
            })}

            {/* Load More section */}
            {hasMore && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
                {workspaceBirdIcon && (
                  <img
                    src={`/img/w/${workspaceBirdIcon}`}
                    alt="Workspace"
                    className="w-5 h-5"
                  />
                )}
                <button
                  onClick={loadMoreTraffic}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Showing {filteredTraffic.length} of {totalAvailable} • Load
                  100 More
                </button>
              </div>
            )}

            {/* Show count even when no more to load */}
            {!hasMore && totalAvailable > 0 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200 text-sm text-gray-500">
                {workspaceBirdIcon && (
                  <img
                    src={`/img/w/${workspaceBirdIcon}`}
                    alt="Workspace"
                    className="w-5 h-5"
                  />
                )}
                Showing {filteredTraffic.length} of {totalAvailable} messages
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
