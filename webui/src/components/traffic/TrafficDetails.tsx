import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';
import { RuleEditor } from '../rules/RuleEditor';
import { Rule } from '../../types/api';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { JsonViewer } from '../ui/JsonViewer';

export function TrafficDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { traffic, setServiceRules, setHighlightedRule } = useAppStore();
  const [showRuleEditor, setShowRuleEditor] = useState(false);

  const entry = traffic.find((t) => t.id === id);

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
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

  const isJsonBody = (body: any): boolean => {
    if (!body) return false;
    if (typeof body === 'object') return true;
    if (typeof body === 'string') {
      try {
        JSON.parse(body);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const parseJsonBody = (body: any): any => {
    if (typeof body === 'object') return body;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  };

  const handleCreateRule = () => {
    setShowRuleEditor(true);
  };

  const handleSaveRule = async (newRule: Rule) => {
    if (!entry) return;

    try {
      await api.createRule(entry.service, newRule);
      toast.success('Rule created successfully!');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);

      setShowRuleEditor(false);
    } catch (error) {
      toast.error('Failed to create rule');
      console.error(error);
    }
  };

  const handleCancelRule = () => {
    setShowRuleEditor(false);
  };

  // Create a rule template from the traffic entry
  const createRuleFromEntry = (): Rule => {
    if (!entry) {
      return {
        match: {},
      };
    }

    // Format response headers for template
    const responseHeadersStr = entry.response?.headers
      ? Object.entries(entry.response.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : 'Content-Type: application/json';

    // Format response body - ensure proper JSON formatting
    let responseBodyStr = '{}';
    if (entry.response?.body) {
      if (isJsonBody(entry.response.body)) {
        const parsedBody = parseJsonBody(entry.response.body);
        responseBodyStr = JSON.stringify(parsedBody, null, 2);
      } else {
        responseBodyStr = typeof entry.response.body === 'string'
          ? entry.response.body
          : JSON.stringify(entry.response.body, null, 2);
      }
    }

    // Build template
    const template = `${entry.response?.delay_ms ? `+${entry.response.delay_ms}ms\n` : ''}[${entry.response?.status_code || 200}]
headers:
  ${responseHeadersStr.split('\n').join('\n  ')}
body:
${responseBodyStr}`;

    // Convert query parameters from string[] to string (take first value)
    const queryParams = Object.keys(entry.query || {}).length > 0
      ? Object.fromEntries(
          Object.entries(entry.query).map(([k, v]) => [k, v[0]])
        )
      : undefined;

    return {
      match: {
        method: [entry.method],
        path: entry.path,
        query: queryParams,
      },
      response: template,
    };
  };

  const handleCopyAsCurl = () => {
    if (!entry) return;

    // Build curl command
    let curl = `curl -X ${entry.method}`;

    // Add headers
    Object.entries(entry.headers).forEach(([key, values]) => {
      values.forEach(value => {
        curl += ` -H "${key}: ${value}"`;
      });
    });

    // Add body if present
    if (entry.body) {
      const bodyStr = typeof entry.body === 'string' ? entry.body : JSON.stringify(entry.body);
      curl += ` -d '${bodyStr}'`;
    }

    // Add URL
    const queryStr = Object.entries(entry.query)
      .flatMap(([key, values]) => values.map(v => `${key}=${v}`))
      .join('&');
    const url = `http://localhost:6625${entry.path}${queryStr ? '?' + queryStr : ''}`;
    curl += ` "${url}"`;

    // Copy to clipboard
    navigator.clipboard.writeText(curl);
    toast.success('Copied cURL command to clipboard!');
  };

  const handleGoToRule = () => {
    if (!entry || entry.matched_rule === undefined) return;

    // Set the highlighted rule
    setHighlightedRule({
      service: entry.service,
      index: entry.matched_rule,
    });

    // Navigate to rules view
    navigate('/rules');
  };

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-gray-800">{entry.path}</h2>
              <Tag variant="method">{entry.method}</Tag>
              {entry.matched_rule !== undefined && (
                <button
                  onClick={handleGoToRule}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                  title="Go to rule"
                >
                  → Rule #{entry.matched_rule + 1}: {entry.service}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            ← Back to Stream
          </Button>
        </div>

        {/* Request Section */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">Request</h3>

          {/* Query */}
          {Object.keys(entry.query).length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-normal text-gray-600 mb-1">query:</p>
              <div className="ml-4 text-xs font-mono text-gray-800">
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
          <div className="mb-3">
            <p className="text-xs font-normal text-gray-600 mb-1">headers:</p>
            <pre className="ml-4 text-xs font-mono text-gray-800 whitespace-pre-wrap">
              {formatHeaders(entry.headers)}
            </pre>
          </div>

          {/* Body */}
          <div className="mb-3">
            <p className="text-xs font-normal text-gray-600 mb-1">body:</p>
            <div className="ml-4">
              {isJsonBody(entry.body) ? (
                <div className="bg-gray-50 p-3 rounded">
                  <JsonViewer data={parseJsonBody(entry.body)} defaultExpanded={true} />
                </div>
              ) : (
                <SyntaxHighlighter
                  language="json"
                  style={oneLight}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: '0.25rem',
                  }}
                >
                  {formatBody(entry.body)}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </div>

        {/* Response Section */}
        {entry.response && (
          <>
            <div className="border-t border-gray-200 my-4"></div>

            <div>
              <h3 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">Response</h3>

              {/* Delay and Status */}
              <div className="mb-3">
                {entry.response.delay_ms > 0 && (
                  <p className="text-xs font-mono text-gray-600">
                    +{entry.response.delay_ms}ms
                  </p>
                )}
                <p className="text-xs font-mono text-gray-800">
                  [{entry.response.status_code}]
                </p>
              </div>

              {/* Headers */}
              <div className="mb-3">
                <p className="text-xs font-normal text-gray-600 mb-1">headers:</p>
                <pre className="ml-4 text-xs font-mono text-gray-800">
                  {entry.response.headers && Object.entries(entry.response.headers).map(([key, value]) => (
                    <div key={key}>
                      {key}: {value}
                    </div>
                  ))}
                </pre>
              </div>

              {/* Body */}
              <div className="mb-3">
                <p className="text-xs font-normal text-gray-600 mb-1">body:</p>
                <div className="ml-4">
                  {entry.response.headers?.['Content-Encoding'] === 'gzip' ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-gray-700">
                      <span className="text-yellow-700 font-medium">⚠️ Compressed (gzip)</span>
                      <p className="mt-1 text-gray-600">
                        Response body is gzip compressed. Length: {entry.response.headers?.['Content-Length'] || 'unknown'} bytes
                      </p>
                    </div>
                  ) : isJsonBody(entry.response.body) ? (
                    <div className="bg-gray-50 p-3 rounded">
                      <JsonViewer data={parseJsonBody(entry.response.body)} defaultExpanded={true} />
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language="json"
                      style={oneLight}
                      customStyle={{
                        margin: 0,
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.25rem',
                      }}
                    >
                      {entry.response.body || '(empty)'}
                    </SyntaxHighlighter>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
          <Button variant="secondary" size="sm" onClick={handleCreateRule}>
            Create Rule
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopyAsCurl}>
            Copy as cURL
          </Button>
        </div>
        </div>
      </div>

      {showRuleEditor && entry && (
        <RuleEditor
          service={entry.service}
          rule={createRuleFromEntry()}
          index={-1}
          onSave={handleSaveRule}
          onCancel={handleCancelRule}
        />
      )}
    </>
  );
}
