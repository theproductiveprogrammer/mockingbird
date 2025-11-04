import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { Tag } from '../ui/Tag';

export function StatsView() {
  const { stats, setStats, traffic } = useAppStore();

  useEffect(() => {
    api.getStats().then(setStats);
  }, [setStats]);

  // Calculate client-side stats from traffic
  const statusCodes = traffic.reduce((acc, entry) => {
    if (entry.response) {
      const code = entry.response.status_code;
      acc[code] = (acc[code] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const ruleTypes = traffic.reduce((acc, entry) => {
    acc[entry.rule_type] = (acc[entry.rule_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const methods = traffic.reduce((acc, entry) => {
    acc[entry.method] = (acc[entry.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading statistics...</p>
      </div>
    );
  }

  const getStatusColor = (code: number): string => {
    if (code >= 200 && code < 300) return 'bg-green-100 text-green-800';
    if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-800';
    if (code >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRuleTypeColor = (type: string): string => {
    if (type === 'mock') return 'bg-blue-100 text-blue-800';
    if (type === 'proxy') return 'bg-green-100 text-green-800';
    if (type === 'timeout') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Statistics</h1>

        {/* Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Total Requests</p>
            <p className="text-3xl font-semibold text-gray-900">{traffic.length}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Total Rules</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.total_rules}</p>
          </div>
        </div>

        {/* By Service */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Service</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {Object.entries(stats.services).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No service statistics available</p>
              </div>
            ) : (
              Object.entries(stats.services).map(([service, serviceStats]) => (
                <div key={service} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      /{service}
                    </span>
                    <Tag variant="service">{serviceStats.rules} rules</Tag>
                  </div>
                  <div className="text-sm text-gray-600">
                    {serviceStats.requests} requests
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By HTTP Method */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By HTTP Method</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {Object.keys(methods).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              Object.entries(methods)
                .sort(([, a], [, b]) => b - a)
                .map(([method, count]) => (
                  <div key={method} className="p-4 flex items-center justify-between">
                    <Tag variant="method">{method}</Tag>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / traffic.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* By Status Code */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Status Code</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {Object.keys(statusCodes).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No responses yet</p>
              </div>
            ) : (
              Object.entries(statusCodes)
                .sort(([, a], [, b]) => b - a)
                .map(([code, count]) => (
                  <div key={code} className="p-4 flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        Number(code)
                      )}`}
                    >
                      {code}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / traffic.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* By Rule Type */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Rule Type</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {Object.keys(ruleTypes).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              Object.entries(ruleTypes)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="p-4 flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getRuleTypeColor(
                        type
                      )}`}
                    >
                      {type}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / traffic.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
