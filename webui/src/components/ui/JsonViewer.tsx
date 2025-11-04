import { useState } from 'react';

interface JsonViewerProps {
  data: any;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, defaultExpanded = false }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);
  const isArray = Array.isArray(data);
  const isPrimitive = !isObject && !isArray;

  if (isPrimitive) {
    return <span className="text-blue-600">{JSON.stringify(data)}</span>;
  }

  const entries = isArray ? data.map((item, i) => [i, item]) : Object.entries(data);
  const hasChildren = entries.length > 0;

  return (
    <div className="font-mono text-xs">
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-800 mr-1"
        >
          {expanded ? '▼' : '▶'}
        </button>
      )}
      <span className="text-gray-600">{isArray ? '[' : '{'}</span>
      {!expanded && hasChildren && (
        <span className="text-gray-500"> ... {entries.length} items </span>
      )}
      {expanded && hasChildren && (
        <div className="ml-4 border-l border-gray-200 pl-2">
          {entries.map(([key, value], index) => (
            <div key={key} className="py-0.5">
              <span className="text-purple-600">
                {isArray ? `[${key}]` : `"${key}"`}
              </span>
              <span className="text-gray-500">: </span>
              <JsonViewer data={value} defaultExpanded={false} />
              {index < entries.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          ))}
        </div>
      )}
      <span className="text-gray-600">{isArray ? ']' : '}'}</span>
    </div>
  );
}
