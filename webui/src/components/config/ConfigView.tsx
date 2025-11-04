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
        <h1 className="text-xs font-medium mb-3 text-gray-600 uppercase tracking-wider">Configuration</h1>

        {/* Server Settings */}
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">Server Settings</h2>
          <div className="border border-gray-200 rounded divide-y divide-gray-200">
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-700">Proxy Port</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Main proxy server for intercepting requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                  {config.proxy_port}
                </code>
                <span className="text-xs text-gray-500">http://localhost:{config.proxy_port}</span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-700">Admin Port</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Admin API and dashboard server
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                  {config.admin_port}
                </code>
                <span className="text-xs text-gray-500">http://localhost:{config.admin_port}</span>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-normal text-gray-700">Config Directory</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Location for rules and config files
                </p>
              </div>
              <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                {config.config_dir}
              </code>
            </div>
          </div>
        </div>

        {/* Config Values */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-600 uppercase tracking-wider">Config Values</h2>
            <span className="text-xs text-gray-400">{configValues.length} values</span>
          </div>

          {configValues.length === 0 ? (
            <div className="border border-gray-200 rounded p-6 text-center text-gray-500">
              <p className="text-xs">No config values defined</p>
              <p className="text-xs mt-1 text-gray-400">
                Add values to config.json to use them in templates
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded divide-y divide-gray-200">
              {configValues.map(([key, value]) => (
                <div key={key} className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-normal text-gray-700 font-mono">{key}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Use in templates: {`{{ config \`${key}\` }}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                      {revealed.has(key) ? value : maskValue(value)}
                    </code>
                    <button
                      onClick={() => toggleReveal(key)}
                      className="text-xs text-gray-500 hover:text-gray-700"
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
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Config values are loaded from{' '}
            <code className="bg-gray-100 px-1 rounded">config.json</code> in the config
            directory. Restart the server after making changes.
          </p>
        </div>
      </div>
    </div>
  );
}
