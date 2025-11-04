import { useState } from 'react';
import { Rule, MatchCondition } from '../../types/api';
import { Button } from '../ui/Button';

interface RuleEditorProps {
  service: string;
  rule: Rule;
  index: number;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

// Parse mock template to extract delay, status, headers, body
function parseTemplate(template: string) {
  const lines = template.split('\n');
  let delay = '';
  let status = '200';
  let headers = '';
  let body = '';
  let inHeaders = false;
  let inBody = false;

  for (const line of lines) {
    if (line.startsWith('+')) {
      delay = line.substring(1).trim();
    } else if (line.match(/^\[(\d+)\]$/)) {
      status = line.match(/\[(\d+)\]/)![1];
    } else if (line.trim() === 'headers:') {
      inHeaders = true;
      inBody = false;
    } else if (line.match(/^body/)) {
      inHeaders = false;
      inBody = true;
    } else if (inHeaders && line.trim()) {
      headers += (headers ? '\n' : '') + line.trim();
    } else if (inBody && line.trim()) {
      body += (body ? '\n' : '') + line.trim();
    }
  }

  return { delay, status, headers, body };
}

// Rebuild template from form fields
function buildTemplate(delay: string, status: string, headers: string, body: string): string {
  let template = '';

  if (delay) {
    template += `+${delay}\n`;
  }

  template += `[${status}]\n`;

  if (headers.trim()) {
    template += 'headers:\n';
    headers.split('\n').forEach(line => {
      if (line.trim()) {
        template += `  ${line.trim()}\n`;
      }
    });
  }

  if (body.trim()) {
    template += 'body:json\n';
    template += body.trim();
  }

  return template;
}

export function RuleEditor({ service, rule, index, onSave, onCancel }: RuleEditorProps) {
  const [methods, setMethods] = useState<string[]>(rule.match.method || []);
  const [path, setPath] = useState(rule.match.path || '');
  const [matchHeaders, setMatchHeaders] = useState(
    Object.entries(rule.match.headers || {}).map(([key, value]) => ({ key, value }))
  );
  const [bodyMatch, setBodyMatch] = useState(rule.match.body?.matches || '');
  const [responseType, setResponseType] = useState<'mock' | 'proxy'>(
    rule.response ? 'mock' : 'proxy'
  );

  // Parse existing template
  const parsedTemplate = rule.response ? parseTemplate(rule.response) : { delay: '', status: '200', headers: '', body: '' };

  const [delay, setDelay] = useState(parsedTemplate.delay);
  const [status, setStatus] = useState(parsedTemplate.status);
  const [responseHeaders, setResponseHeaders] = useState(parsedTemplate.headers);
  const [responseBody, setResponseBody] = useState(parsedTemplate.body);

  const [proxyUrl, setProxyUrl] = useState(rule.proxyto || '');
  const [proxyHeaders, setProxyHeaders] = useState(
    Object.entries(rule.headers || {}).map(([key, value]) => ({ key, value }))
  );

  const availableMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const toggleMethod = (method: string) => {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const addMatchHeader = () => {
    setMatchHeaders([...matchHeaders, { key: '', value: '' }]);
  };

  const updateMatchHeader = (idx: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...matchHeaders];
    newHeaders[idx][field] = value;
    setMatchHeaders(newHeaders);
  };

  const removeMatchHeader = (idx: number) => {
    setMatchHeaders(matchHeaders.filter((_, i) => i !== idx));
  };

  const addProxyHeader = () => {
    setProxyHeaders([...proxyHeaders, { key: '', value: '' }]);
  };

  const updateProxyHeader = (idx: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...proxyHeaders];
    newHeaders[idx][field] = value;
    setProxyHeaders(newHeaders);
  };

  const removeProxyHeader = (idx: number) => {
    setProxyHeaders(proxyHeaders.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const matchCondition: MatchCondition = {
      method: methods.length > 0 ? methods : undefined,
      path: path || undefined,
      headers:
        matchHeaders.length > 0 && matchHeaders.some((h) => h.key)
          ? Object.fromEntries(matchHeaders.filter((h) => h.key).map((h) => [h.key, h.value]))
          : undefined,
      body: bodyMatch ? { matches: bodyMatch } : undefined,
    };

    const updatedRule: Rule = {
      match: matchCondition,
      proxyto: responseType === 'proxy' ? proxyUrl : undefined,
      headers:
        responseType === 'proxy' && proxyHeaders.length > 0 && proxyHeaders.some((h) => h.key)
          ? Object.fromEntries(proxyHeaders.filter((h) => h.key).map((h) => [h.key, h.value]))
          : undefined,
      response: responseType === 'mock' ? buildTemplate(delay, status, responseHeaders, responseBody) : undefined,
    };

    onSave(updatedRule);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">
            Edit Rule #{index + 1}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Service: /{service}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Match Conditions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Match Conditions</h3>

            {/* Methods */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableMethods.map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={methods.includes(method)}
                      onChange={() => toggleMethod(method)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Path */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Path:
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/servicex/users/**"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">(use ** for wildcards)</p>
            </div>

            {/* Match Headers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Match Headers (optional):
                </label>
                <Button variant="secondary" size="sm" onClick={addMatchHeader}>
                  + Add Header Match
                </Button>
              </div>
              {matchHeaders.map((header, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateMatchHeader(idx, 'key', e.target.value)}
                    placeholder="Header-Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateMatchHeader(idx, 'value', e.target.value)}
                    placeholder="value or regex"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={() => removeMatchHeader(idx)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Body Match */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Body Regex (optional):
              </label>
              <input
                type="text"
                value={bodyMatch}
                onChange={(e) => setBodyMatch(e.target.value)}
                placeholder=".*charles.*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Action */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Action</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={responseType === 'mock'}
                  onChange={() => setResponseType('mock')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Return Mock Response</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={responseType === 'proxy'}
                  onChange={() => setResponseType('proxy')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Proxy to Upstream</span>
              </label>
            </div>
          </div>

          {/* Response */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Response</h3>

            {responseType === 'mock' ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay: (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={delay}
                        onChange={(e) => setDelay(e.target.value)}
                        placeholder="200"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <span className="text-sm text-gray-600">ms</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status:
                    </label>
                    <input
                      type="text"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headers:
                  </label>
                  <textarea
                    value={responseHeaders}
                    onChange={(e) => setResponseHeaders(e.target.value)}
                    placeholder="Content-Type: application/json&#10;X-Request-ID: {{ uuid }}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    One header per line: Key: Value
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body:
                  </label>
                  <textarea
                    value={responseBody}
                    onChange={(e) => setResponseBody(e.target.value)}
                    placeholder={`{&#10;  "id": "{{ uuid }}",&#10;  "user": "{{ reqBody \`username\` }}",&#10;  "email": "{{ reqBody \`email\` }}"&#10;}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use backticks for template variables: {`{{ uuid }}`}, {`{{ reqBody \`field\` }}`}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-900">
                    We'll format this correctly to YAML when saving
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proxy URL:
                  </label>
                  <input
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Inject Headers (optional):
                    </label>
                    <Button variant="secondary" size="sm" onClick={addProxyHeader}>
                      + Add Header
                    </Button>
                  </div>
                  {proxyHeaders.map((header, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateProxyHeader(idx, 'key', e.target.value)}
                        placeholder="Header-Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateProxyHeader(idx, 'value', e.target.value)}
                        placeholder="value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeProxyHeader(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Rule
          </Button>
        </div>
      </div>
    </div>
  );
}
