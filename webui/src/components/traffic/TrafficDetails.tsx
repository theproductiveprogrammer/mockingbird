import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';

export function TrafficDetails() {
  const { traffic, selectedTrafficId, setSelectedTrafficId } = useAppStore();

  const entry = traffic.find((t) => t.id === selectedTrafficId);

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No traffic selected
      </div>
    );
  }

  const formatHeaders = (headers: Record<string, string[]>) => {
    return Object.entries(headers).map(([key, values]) =>
      values.map((value) => {
        // Redact potential secrets
        const shouldRedact = key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('auth');
        return `${key}: ${shouldRedact ? '[redacted]' : value}`;
      }).join('\n')
    ).join('\n');
  };

  const formatBody = (body: any) => {
    if (!body) return '(none)';
    if (typeof body === 'string') return body;
    return JSON.stringify(body, null, 2);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{entry.path}</h2>
            <Tag variant="method">{entry.method}</Tag>
            {entry.matched_rule !== undefined && (
              <Tag variant="service">
                Rule #{entry.matched_rule}: {entry.service}
              </Tag>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedTrafficId(null)}>
            ← Back to Stream
          </Button>
        </div>

        {/* Request Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Request</h3>

          {/* Query */}
          {Object.keys(entry.query).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-1">query:</p>
              <div className="ml-4 text-sm font-mono text-gray-800">
                {Object.entries(entry.query).map(([key, values]) =>
                  values.map((v, i) => (
                    <div key={`${key}-${i}`}>
                      {key}: {v}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Headers */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-1">headers:</p>
            <pre className="ml-4 text-sm font-mono text-gray-800 whitespace-pre-wrap">
              {formatHeaders(entry.headers)}
            </pre>
          </div>

          {/* Body */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-1">body:</p>
            <div className="ml-4">
              <SyntaxHighlighter
                language="json"
                style={oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.25rem',
                }}
              >
                {formatBody(entry.body)}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Response Section */}
        {entry.response && (
          <>
            <div className="border-t border-gray-200 my-4"></div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Response</h3>

              {/* Delay and Status */}
              <div className="mb-4">
                {entry.response.delay_ms > 0 && (
                  <p className="text-sm font-mono text-gray-600">
                    +{entry.response.delay_ms}ms
                  </p>
                )}
                <p className="text-sm font-mono text-gray-800">
                  [{entry.response.status_code}]
                </p>
              </div>

              {/* Headers */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-1">headers:</p>
                <pre className="ml-4 text-sm font-mono text-gray-800">
                  {Object.entries(entry.response.headers).map(([key, value]) => (
                    <div key={key}>
                      {key}: {value}
                    </div>
                  ))}
                </pre>
              </div>

              {/* Body */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-1">body:</p>
                <div className="ml-4">
                  <SyntaxHighlighter
                    language="json"
                    style={oneLight}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      borderRadius: '0.25rem',
                    }}
                  >
                    {entry.response.body}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
          <Button variant="secondary" size="sm">
            Create Rule
          </Button>
          <Button variant="secondary" size="sm">
            Copy as cURL
          </Button>
        </div>
      </div>
    </div>
  );
}
