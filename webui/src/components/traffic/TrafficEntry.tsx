import { useNavigate } from "react-router-dom";
import { TrafficEntry as TrafficEntryType } from "../../types/api";
import {
  formatTime,
  formatQueryParams,
  formatRequestSummary,
  formatResponseSummary,
  getStatusColor,
  getRuleTypeBadgeClasses,
  formatPathParts,
} from "../../utils/formatters";

interface TrafficEntryProps {
  entry: TrafficEntryType;
  isNew?: boolean;
}

export function TrafficEntry({ entry, isNew = false }: TrafficEntryProps) {
  const navigate = useNavigate();
  const queryString = formatQueryParams(entry.query);
  const statusColor = getStatusColor(entry);

  // Parse response summary to extract and style the rule type badge
  const responseSummary = formatResponseSummary(entry);
  const ruleTypeBadgeClasses = entry.rule_type
    ? getRuleTypeBadgeClasses(entry.rule_type)
    : "";

  const pathParts = formatPathParts(entry);

  return (
    <div
      onClick={() => navigate(`/traffic/${entry.id}`)}
      className={`group px-6 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${isNew ? "new-entry" : ""}`}
    >
      <div className="items-center gap-2 text-xs font-mono">
        {/* Timestamp, Method, Path, Query */}
        <span className="text-gray-600">[{formatTime(entry.timestamp)}] </span>
        {pathParts.service && (
          <span className="text-gray-600 text-xs">{pathParts.service}</span>
        )}
        <span className="text-gray-900 font-semibold">{pathParts.path}</span>
        <span className="text-xs group-hover:text-blue-600 opacity-70 group-hover:opacity-100 transition-opacity">
          {" "}
          {queryString}{" "}
        </span>
        {/* Request summary */}
        <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity group-hover:text-blue-600">
          {" "}
          → {formatRequestSummary(entry)}
        </span>
        {/* Response summary */}
        <span
          className={`text-xs opacity-60 group-hover:opacity-100 transition-opacity ${statusColor}`}
        >
          {" "}
          ←
          {responseSummary.ruleType && (
            <span className={`${ruleTypeBadgeClasses} px-1 rounded`}>
              [{responseSummary.ruleType} {responseSummary.delayStr}]
            </span>
          )}
          {responseSummary.status_code &&
            responseSummary.status_code !== 200 && (
              <span>[{responseSummary.status_code}] </span>
            )}
          {responseSummary.bodySummary}
        </span>
      </div>
    </div>
  );
}
