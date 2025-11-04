import { useNavigate } from 'react-router-dom';
import { TrafficEntry as TrafficEntryType } from '../../types/api';
import {
  formatTime,
  formatQueryParams,
  formatRequestSummary,
  formatResponseSummary,
  getStatusColor,
} from '../../utils/formatters';
import { Tag } from '../ui/Tag';

interface TrafficEntryProps {
  entry: TrafficEntryType;
}

export function TrafficEntry({ entry }: TrafficEntryProps) {
  const navigate = useNavigate();
  const queryString = formatQueryParams(entry.query);
  const statusColor = entry.response
    ? getStatusColor(entry.response.status_code)
    : 'text-gray-600';

  return (
    <div
      onClick={() => navigate(`/traffic/${entry.id}`)}
      className="px-6 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
    >
      {/* Line 1: Timestamp, Method, Path, Query */}
      <div className="flex items-center gap-2 text-sm font-mono">
        <span className="text-gray-600">[{formatTime(entry.timestamp)}]</span>
        <Tag variant="method">{entry.method}</Tag>
        <span className="text-gray-900">{entry.path}</span>
        {queryString && <span className="text-gray-600 text-xs">{queryString}</span>}
      </div>

      {/* Line 2: Request summary */}
      <div className="mt-1 ml-28 text-sm text-gray-700 font-mono">
        <span className="text-gray-500">→ </span>
        {formatRequestSummary(entry)}
      </div>

      {/* Line 3: Response summary */}
      <div className={`mt-1 ml-28 text-sm font-mono ${statusColor}`}>
        <span className="text-gray-500">← </span>
        {formatResponseSummary(entry)}
      </div>
    </div>
  );
}
