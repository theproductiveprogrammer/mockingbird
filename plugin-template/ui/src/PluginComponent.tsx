import { useState, useEffect } from 'react';
import { PluginComponentProps } from './types';

interface PluginData {
  requests?: Array<{
    path: string;
    method: string;
    timestamp: string;
  }>;
}

export default function MyPluginUI({ api }: PluginComponentProps) {
  const [data, setData] = useState<PluginData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.action('load', 'data');
      setData((result as any).data || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    try {
      await api.action('clear', 'all');
      api.refresh(); // Reload component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-600">Loading plugin data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-red-900 mb-2">Error</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  const requests = data?.requests || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Plugin UI</h2>
          <p className="text-sm text-gray-500">
            Workspace: <span className="font-medium">{api.workspace}</span>
          </p>
        </div>
        <button
          onClick={handleClearData}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Clear Data
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">GET Requests</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {requests.filter(r => r.method === 'GET').length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">POST Requests</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {requests.filter(r => r.method === 'POST').length}
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">Recent Requests</h3>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No requests captured yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.slice(0, 10).map((request, index) => (
              <div key={index} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        request.method === 'GET'
                          ? 'bg-blue-100 text-blue-700'
                          : request.method === 'POST'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {request.method}
                      </span>
                      <span className="text-sm font-mono text-gray-900">
                        {request.path}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Example: Add any UI libraries you need */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Pro Tip</h4>
        <p className="text-xs text-blue-700">
          You can add any npm packages to enhance your plugin UI:
          <br />
          • <code className="bg-blue-100 px-1 rounded">recharts</code> for charts
          <br />
          • <code className="bg-blue-100 px-1 rounded">react-hook-form</code> for forms
          <br />
          • <code className="bg-blue-100 px-1 rounded">@tanstack/react-table</code> for data tables
        </p>
      </div>
    </div>
  );
}
