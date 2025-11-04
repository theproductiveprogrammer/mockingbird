import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { Tag } from '../ui/Tag';

export function ConfigView() {
  const { config, setConfig } = useAppStore();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getConfig().then(setConfig);
  }, [setConfig]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading configuration...</p>
      </div>
    );
  }

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const maskValue = (value: string): string => {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  };

  const configValues = Object.entries(config.values);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Configuration</h1>

        {/* Server Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Server Settings</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Proxy Port</p>
                <p className="text-xs text-gray-500 mt-1">
                  Main proxy server for intercepting requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded">
                  {config.proxy_port}
                </code>
                <Tag variant="service">http://localhost:{config.proxy_port}</Tag>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Admin Port</p>
                <p className="text-xs text-gray-500 mt-1">
                  Admin API and dashboard server
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded">
                  {config.admin_port}
                </code>
                <Tag variant="service">http://localhost:{config.admin_port}</Tag>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Config Directory</p>
                <p className="text-xs text-gray-500 mt-1">
                  Location for rules and config files
                </p>
              </div>
              <code className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-1 rounded">
                {config.config_dir}
              </code>
            </div>
          </div>
        </div>

        {/* Config Values */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Config Values</h2>
            <Tag variant="service">{configValues.length} values</Tag>
          </div>

          {configValues.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              <p className="text-sm">No config values defined</p>
              <p className="text-xs mt-2">
                Add values to config.json to use them in templates
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {configValues.map(([key, value]) => (
                <div key={key} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 font-mono">{key}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Use in templates: {`{{ config \`${key}\` }}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded">
                      {revealed.has(key) ? value : maskValue(value)}
                    </code>
                    <button
                      onClick={() => toggleReveal(key)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {revealed.has(key) ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Config values are loaded from{' '}
            <code className="bg-blue-100 px-1 rounded">config.json</code> in the config
            directory. Restart the server after making changes.
          </p>
        </div>
      </div>
    </div>
  );
}
