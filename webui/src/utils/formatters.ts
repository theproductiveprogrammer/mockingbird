import { format } from 'date-fns';
import { TrafficEntry } from '../types/api';

export function formatTime(timestamp: string): string {
  return format(new Date(timestamp), 'HH:mm:ss');
}

export function formatQueryParams(query: Record<string, string[]>): string {
  const params = Object.entries(query)
    .flatMap(([key, values]) => values.map((v) => `${key}=${v}`))
    .join('|');
  return params || '';
}

export function formatRequestSummary(entry: TrafficEntry): string {
  if (!entry.body) return '(no body)';

  if (typeof entry.body === 'string') {
    return entry.body.length > 60 ? entry.body.substring(0, 60) + '...' : entry.body;
  }

  // JSON body - show key fields
  const keys = Object.keys(entry.body).slice(0, 3);
  const summary = keys.map((k) => `${k}: ${JSON.stringify(entry.body[k])}`).join(', ');
  return summary.length > 60 ? summary.substring(0, 60) + '...' : summary;
}

export function formatResponseSummary(entry: TrafficEntry): string {
  if (!entry.response) return 'no response';

  const { status_code, delay_ms, body } = entry.response;
  const ruleType = entry.rule_type;

  // Parse body if it's JSON
  let bodySummary = '';
  try {
    const parsed = JSON.parse(body);
    const keys = Object.keys(parsed).slice(0, 3);
    bodySummary = keys.map((k) => `${k}: ${JSON.stringify(parsed[k])}`).join(', ');
  } catch {
    bodySummary = body.length > 40 ? body.substring(0, 40) + '...' : body;
  }

  return `[${status_code}] [${delay_ms}ms] {${ruleType}} ${bodySummary}`;
}

export function getStatusColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
  if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600';
  if (statusCode >= 500) return 'text-red-600';
  return 'text-gray-600';
}
