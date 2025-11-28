import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';
import { RuleEditor } from '../rules/RuleEditor';
import { Rule, TrafficEntry as TrafficEntryType } from '../../types/api';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { JsonViewer } from '../ui/JsonViewer';

export function TrafficDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { traffic, setServiceRules, setHighlightedRule, config, workspace } = useAppStore();
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [entry, setEntry] = useState<TrafficEntryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to find entry in store first, otherwise fetch it
  useEffect(() => {
    const storeEntry = traffic.find((t) => t.id === id);

    if (storeEntry) {
      setEntry(storeEntry);
      setLoading(false);
    } else if (id) {
      // Entry not in store, fetch it directly
      setLoading(true);
      api.getTrafficById(id)
        .then((fetchedEntry) => {
          setEntry(fetchedEntry);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load traffic entry:', err);
          setError('Failed to load traffic entry');
          setLoading(false);
        });
    }
  }, [id, traffic]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Loading...
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        <div className="text-center">
          <p className="text-sm font-normal">{error || 'Traffic entry not found'}</p>
        </div>
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

  // Detect if body is SSE (Server-Sent Events) format
  const isSSEBody = (body: any): boolean => {
    if (typeof body !== 'string') return false;
    const lines = body.trim().split('\n');
    // Check if multiple lines start with "data:"
    const dataLines = lines.filter(line => line.trim().startsWith('data:'));
    return dataLines.length > 1;
  };

  // Parse SSE body into array of parsed JSON objects
  const parseSSEBody = (body: string): any[] => {
    const lines = body.trim().split('\n');
    const events: any[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.substring(5).trim(); // Remove "data:" prefix
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            events.push(JSON.parse(jsonStr));
          } catch (e) {
            // If parsing fails, keep the raw string
            events.push(jsonStr);
          }
        }
      }
    }

    return events;
  };

  // Detect if SSE stream is from OpenAI
  const isOpenAIStream = (events: any[]): boolean => {
    if (events.length === 0) return false;
    const firstEvent = events[0];
    return firstEvent?.object === 'chat.completion.chunk' ||
           firstEvent?.object === 'text_completion.chunk';
  };

  // Extract readable content from OpenAI stream
  const extractOpenAIContent = (events: any[]): {
    content: string,
    toolCalls: any[],
    model: string,
    finishReason: string | null
  } => {
    let content = '';
    const toolCalls: any[] = [];
    let model = '';
    let finishReason: string | null = null;

    for (const event of events) {
      if (typeof event !== 'object') continue;

      // Get model from first event
      if (!model && event.model) {
        model = event.model;
      }

      // Extract content and tool calls from choices
      if (event.choices && Array.isArray(event.choices)) {
        for (const choice of event.choices) {
          // Regular content
          if (choice.delta?.content) {
            content += choice.delta.content;
          }

          // Tool calls
          if (choice.delta?.tool_calls) {
            for (const toolCall of choice.delta.tool_calls) {
              const index = toolCall.index || 0;

              // Initialize tool call if needed
              if (!toolCalls[index]) {
                toolCalls[index] = {
                  id: toolCall.id || '',
                  type: toolCall.type || 'function',
                  function: {
                    name: toolCall.function?.name || '',
                    arguments: ''
                  }
                };
              }

              // Append to existing tool call
              if (toolCall.id) toolCalls[index].id = toolCall.id;
              if (toolCall.function?.name) toolCalls[index].function.name = toolCall.function.name;
              if (toolCall.function?.arguments) toolCalls[index].function.arguments += toolCall.function.arguments;
            }
          }

          // Finish reason
          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }
        }
      }
    }

    // Parse tool call arguments if they're JSON strings
    for (const toolCall of toolCalls) {
      if (toolCall.function?.arguments) {
        try {
          toolCall.function.arguments = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    }

    return { content, toolCalls: toolCalls.filter(Boolean), model, finishReason };
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

  const handleCopyRequestBody = () => {
    if (!entry) return;
    const bodyStr = formatBody(entry.body);
    navigator.clipboard.writeText(bodyStr);
    toast.success('Copied request body to clipboard!');
  };

  const handleCopyResponseBody = () => {
    if (!entry?.response) return;
    const bodyStr = formatBody(entry.response.body);
    navigator.clipboard.writeText(bodyStr);
    toast.success('Copied response body to clipboard!');
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

    // Add URL (use dynamic proxy port from config)
    const queryStr = Object.entries(entry.query)
      .flatMap(([key, values]) => values.map(v => `${key}=${v}`))
      .join('&');
    const proxyPort = config?.proxy_port || 6625; // Fallback to default if config not loaded
    const hostname = window.location.hostname || 'localhost';
    const url = `http://${hostname}:${proxyPort}${entry.path}${queryStr ? '?' + queryStr : ''}`;
    curl += ` "${url}"`;

    // Copy to clipboard
    navigator.clipboard.writeText(curl);
    toast.success('Copied cURL command to clipboard!');
  };

  const handleGoToRule = () => {
    if (!entry || entry.current_matched_rule === undefined) return;

    // Set the highlighted rule
    setHighlightedRule({
      service: entry.service,
      index: entry.current_matched_rule,
    });

    // Navigate to rules view (workspace-aware)
    const rulesPath = workspace ? `/w/${workspace}/rules` : '/rules';
    navigate(rulesPath);
  };

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-gray-800">{entry.path}</h2>
            <Tag variant="method">{entry.method}</Tag>
            {entry.current_matched_rule !== undefined && (
              <button
                onClick={handleGoToRule}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                title="Go to rule"
              >
                Currently matches: Rule #{entry.current_matched_rule + 1}
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-2">
            {new Date(entry.timestamp).toLocaleString()}
          </div>
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
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-normal text-gray-600">body:</p>
              <button
                onClick={handleCopyRequestBody}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                title="Copy request body"
              >
                [copy]
              </button>
            </div>
            <div className="ml-4">
              {isSSEBody(entry.body) ? (
                (() => {
                  const events = parseSSEBody(entry.body);
                  const isOpenAI = isOpenAIStream(events);
                  const openAIContent = isOpenAI ? extractOpenAIContent(events) : null;

                  return (
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="mb-2 text-xs text-blue-600 font-medium">
                        📡 SSE Stream ({events.length} events)
                      </div>

                      {isOpenAI && openAIContent && (
                        <div className="mb-4 bg-white border border-blue-200 rounded p-3">
                          <div className="text-xs font-semibold text-gray-700 mb-2">
                            🤖 OpenAI Response ({openAIContent.model})
                          </div>

                          {openAIContent.content && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">Content:</div>
                              <div className="text-xs text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                                {openAIContent.content}
                              </div>
                            </div>
                          )}

                          {openAIContent.toolCalls.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">Tool Calls:</div>
                              <JsonViewer data={openAIContent.toolCalls} defaultExpanded={true} />
                            </div>
                          )}

                          {openAIContent.finishReason && (
                            <div className="text-xs text-gray-500">
                              Finish reason: {openAIContent.finishReason}
                            </div>
                          )}
                        </div>
                      )}

                      <details>
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                          Raw events ({events.length})
                        </summary>
                        <div className="mt-2">
                          <JsonViewer data={events} defaultExpanded={false} />
                        </div>
                      </details>
                    </div>
                  );
                })()
              ) : isJsonBody(entry.body) ? (
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
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-normal text-gray-600">body:</p>
                  <button
                    onClick={handleCopyResponseBody}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    title="Copy response body"
                  >
                    [copy]
                  </button>
                </div>
                <div className="ml-4">
                  {entry.response.headers?.['Content-Encoding'] === 'gzip' ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-gray-700">
                      <span className="text-yellow-700 font-medium">⚠️ Compressed (gzip)</span>
                      <p className="mt-1 text-gray-600">
                        Response body is gzip compressed. Length: {entry.response.headers?.['Content-Length'] || 'unknown'} bytes
                      </p>
                    </div>
                  ) : isSSEBody(entry.response.body) ? (
                    (() => {
                      const events = parseSSEBody(entry.response.body);
                      const isOpenAI = isOpenAIStream(events);
                      const openAIContent = isOpenAI ? extractOpenAIContent(events) : null;

                      return (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="mb-2 text-xs text-blue-600 font-medium">
                            📡 SSE Stream ({events.length} events)
                          </div>

                          {isOpenAI && openAIContent && (
                            <div className="mb-4 bg-white border border-blue-200 rounded p-3">
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                🤖 OpenAI Response ({openAIContent.model})
                              </div>

                              {openAIContent.content && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-gray-600 mb-1">Content:</div>
                                  <div className="text-xs text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                                    {openAIContent.content}
                                  </div>
                                </div>
                              )}

                              {openAIContent.toolCalls.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-gray-600 mb-1">Tool Calls:</div>
                                  <JsonViewer data={openAIContent.toolCalls} defaultExpanded={true} />
                                </div>
                              )}

                              {openAIContent.finishReason && (
                                <div className="text-xs text-gray-500">
                                  Finish reason: {openAIContent.finishReason}
                                </div>
                              )}
                            </div>
                          )}

                          <details>
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                              Raw events ({events.length})
                            </summary>
                            <div className="mt-2">
                              <JsonViewer data={events} defaultExpanded={false} />
                            </div>
                          </details>
                        </div>
                      );
                    })()
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
