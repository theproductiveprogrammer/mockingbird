import { format } from "date-fns";
import { TrafficEntry } from "../types/api";

export function formatTime(timestamp: string): string {
  return format(new Date(timestamp), "HH:mm:ss");
}

export function formatQueryParams(query: Record<string, string[]>): string {
  const params = Object.entries(query)
    .flatMap(([key, values]) => values.map((v) => `${key}=${v}`))
    .join("|");
  return params || "";
}

export function formatRequestSummary(entry: TrafficEntry): string {
  if (!entry.body) return "(no body)";

  if (typeof entry.body === "string") {
    return entry.body.length > 60
      ? entry.body.substring(0, 60) + "..."
      : entry.body;
  }

  // JSON body - show key fields
  const keys = Object.keys(entry.body).slice(0, 3);
  const summary = keys
    .map((k) => `${k}: ${JSON.stringify(entry.body[k])}`)
    .join(", ");
  return summary.length > 60 ? summary.substring(0, 60) + "..." : summary;
}

interface ResponseSummary {
  status_code?: number;
  ruleType?: string;
  delayStr?: string;
  bodySummary?: string;
}

export function formatResponseSummary(entry: TrafficEntry): ResponseSummary {
  if (!entry.response) return { bodySummary: "no response" };

  const { status_code, delay_ms, body } = entry.response;
  const ruleType = entry.rule_type;

  // Parse body if it's JSON
  let bodySummary = "";
  try {
    const parsed = JSON.parse(body);

    if (Array.isArray(parsed)) {
      // Handle arrays
      if (parsed.length === 0) {
        bodySummary = "[]";
      } else if (
        typeof parsed[0] === "object" &&
        parsed[0] !== null &&
        !Array.isArray(parsed[0])
      ) {
        // Array of objects - show first object's keys then count
        const arrayCount = `[${parsed.length} items]`;
        const maxPreviewLength = 60 - arrayCount.length - 4; // Reserve space for "... " and count
        const keys = Object.keys(parsed[0]).slice(0, 3);
        let preview = keys
          .map((k) => {
            const value = parsed[0][k];
            // Simplify arrays in nested properties
            if (Array.isArray(value)) {
              return `${k}: [${value.length} items]`;
            }
            return `${k}: ${JSON.stringify(value)}`;
          })
          .join(", ");
        if (preview.length > maxPreviewLength) {
          preview = preview.substring(0, maxPreviewLength);
        }
        bodySummary = `${preview}... ${arrayCount}`;
      } else {
        // Array of primitives - show first few items then count
        const arrayCount = `[${parsed.length} items]`;
        const maxPreviewLength = 60 - arrayCount.length - 4; // Reserve space for "... " and count
        let preview = parsed
          .slice(0, 3)
          .map((v) => JSON.stringify(v))
          .join(", ");
        if (preview.length > maxPreviewLength) {
          preview = preview.substring(0, maxPreviewLength);
        }
        bodySummary = `${preview}${parsed.length > 3 || preview.length > maxPreviewLength ? "..." : ""} ${arrayCount}`;
      }
    } else if (typeof parsed === "object" && parsed !== null) {
      // Regular object
      const keys = Object.keys(parsed).slice(0, 3);
      bodySummary = keys
        .map((k) => {
          const value = parsed[k];
          // Simplify arrays in properties
          if (Array.isArray(value)) {
            return `${k}: [${value.length} items]`;
          }
          return `${k}: ${JSON.stringify(value)}`;
        })
        .join(", ");
    } else {
      // Primitive
      bodySummary = String(parsed);
    }
  } catch {
    // Not JSON - use as string
    bodySummary = body;
  }

  // Truncate to 60 chars as failsafe for all cases
  bodySummary =
    bodySummary.length > 60
      ? bodySummary.substring(0, 60) + "..."
      : bodySummary;

  // Handle undefined/null/0 delay_ms
  const delayStr =
    delay_ms !== undefined && delay_ms !== null ? `${delay_ms}ms` : "";

  return { status_code, delayStr, ruleType, bodySummary };
}

interface PathParts {
  service?: string;
  path: string;
}

export function formatPathParts(entry: TrafficEntry): PathParts {
  const ndx = entry.path.substring(1).indexOf("/");
  if (ndx == -1) return { path: entry.path };
  else
    return {
      path: entry.path.substring(ndx + 1),
      service: entry.path.substring(0, ndx + 1),
    };
}

export function getStatusColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return "text-green-600";
  if (statusCode >= 400 && statusCode < 500) return "text-yellow-600";
  if (statusCode >= 500) return "text-red-600";
  return "text-gray-600";
}

export function getRuleTypeBadgeClasses(ruleType: string): string {
  switch (ruleType) {
    case "mock":
      return "bg-blue-50 text-blue-700";
    case "proxy":
      return "bg-green-50 text-green-700";
    case "timeout":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
}
