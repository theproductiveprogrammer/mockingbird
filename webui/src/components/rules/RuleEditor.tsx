import { useState, useEffect } from 'react';
import { Rule, MatchCondition } from '../../types/api';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';

interface RuleEditorProps {
  service: string;
  rule: Rule;
  index: number;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

export function RuleEditor({ service, rule, index, onSave, onCancel }: RuleEditorProps) {
  const [methods, setMethods] = useState<string[]>(rule.match.method || []);
  const [path, setPath] = useState(rule.match.path || '');
  const [headers, setHeaders] = useState(
    Object.entries(rule.match.headers || {}).map(([key, value]) => ({ key, value }))
  );
  const [bodyMatch, setBodyMatch] = useState(rule.match.body?.matches || '');
  const [responseType, setResponseType] = useState<'mock' | 'proxy'>(
    rule.response ? 'mock' : 'proxy'
  );
  const [mockTemplate, setMockTemplate] = useState(rule.response || '');
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
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const updateMatchHeader = (idx: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[idx][field] = value;
    setHeaders(newHeaders);
  };

  const removeMatchHeader = (idx: number) => {
    setHeaders(headers.filter((_, i) => i !== idx));
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
        headers.length > 0 && headers.some((h) => h.key)
          ? Object.fromEntries(headers.filter((h) => h.key).map((h) => [h.key, h.value]))
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
      response: responseType === 'mock' ? mockTemplate : undefined,
    };

    onSave(updatedRule);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">
            Edit Rule #{index} - /{service}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Match Conditions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Match Conditions</h3>

            {/* Methods */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => toggleMethod(method)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      methods.includes(method)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Path */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Path Pattern
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/users/**"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use ** for wildcards, {'{id}'} for path params
              </p>
            </div>

            {/* Headers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Match Headers (optional)
                </label>
                <Button variant="secondary" size="sm" onClick={addMatchHeader}>
                  + Add Header
                </Button>
              </div>
              {headers.map((header, idx) => (
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
                Body Match (regex, optional)
              </label>
              <input
                type="text"
                value={bodyMatch}
                onChange={(e) => setBodyMatch(e.target.value)}
                placeholder=".*keyword.*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Response Type */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Response</h3>

            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setResponseType('mock')}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  responseType === 'mock'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Mock Response
              </button>
              <button
                onClick={() => setResponseType('proxy')}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  responseType === 'proxy'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Proxy to URL
              </button>
            </div>

            {responseType === 'mock' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mock Template
                </label>
                <textarea
                  value={mockTemplate}
                  onChange={(e) => setMockTemplate(e.target.value)}
                  placeholder={`+200ms\n[201]\nheaders:\n  Content-Type: application/json\nbody:json\n{\n  "id": "{{ uuid }}"\n}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={12}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use backticks for template variables: {`{{ uuid }}`}, {`{{ reqBody \`field\` }}`}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proxy URL
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
                      Inject Headers (optional)
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
