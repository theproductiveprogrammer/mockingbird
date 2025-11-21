import { useEffect, useState } from 'react';
import { api, Plugin, PluginUI, PluginUIItem } from '../../utils/api';
import toast from 'react-hot-toast';
import { PluginComponentLoader } from './PluginComponentLoader';
import { useParams } from 'react-router-dom';

export function PluginsView() {
  const { workspace } = useParams<{ workspace: string }>();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [pluginUI, setPluginUI] = useState<PluginUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionTextareas, setActionTextareas] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadPlugins();
  }, []);

  useEffect(() => {
    if (selectedPlugin) {
      loadPluginUI(selectedPlugin);
    }
  }, [selectedPlugin]);

  const loadPlugins = async () => {
    try {
      const data = await api.getPlugins();
      setPlugins(data);
      if (data.length > 0 && !selectedPlugin) {
        setSelectedPlugin(data[0].name);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPluginUI = async (pluginName: string) => {
    try {
      const ui = await api.getPluginUI(pluginName);
      setPluginUI(ui);
    } catch (error) {
      console.error('Failed to load plugin UI:', error);
      setPluginUI(null);
    }
  };

  const handleAction = async (pluginName: string, action: string, itemId: string, hasTextarea?: boolean) => {
    try {
      const data: Record<string, unknown> = {};
      if (hasTextarea) {
        data.text = actionTextareas[`${itemId}_${action}`] || '';
      }

      await api.pluginAction(pluginName, action, itemId, data);
      toast.success(`Action "${action}" completed`);

      // Reload plugin UI to see updated state
      await loadPluginUI(pluginName);

      // Clear textarea
      if (hasTextarea) {
        setActionTextareas(prev => {
          const next = { ...prev };
          delete next[`${itemId}_${action}`];
          return next;
        });
      }
    } catch (error) {
      toast.error(`Action failed: ${error}`);
    }
  };

  const handleTogglePlugin = async (pluginName: string, enabled: boolean) => {
    try {
      await api.togglePlugin(pluginName, enabled);
      toast.success(`Plugin ${pluginName} ${enabled ? 'enabled' : 'disabled'}`);
      // Update local state
      setPlugins(prev => prev.map(p =>
        p.name === pluginName ? { ...p, enabled } : p
      ));
    } catch (error) {
      toast.error(`Failed to toggle plugin: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        Loading plugins...
      </div>
    );
  }

  if (plugins.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        <div className="text-center">
          <p className="text-sm font-normal">No plugins installed</p>
          <p className="text-xs mt-1 text-gray-500">
            Add plugins to ~/.config/mockingbird/plugins/
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Plugin Tabs */}
      <div className="border-b border-gray-200 px-6 py-3 flex gap-2">
        {plugins.map((plugin) => (
          <button
            key={plugin.name}
            onClick={() => setSelectedPlugin(plugin.name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedPlugin === plugin.name
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
            } ${!plugin.enabled ? 'opacity-50' : ''}`}
          >
            {plugin.name}
            <span className="ml-1 text-xs text-gray-400">v{plugin.version}</span>
            {!plugin.enabled && (
              <span className="ml-1 text-xs text-red-400">(off)</span>
            )}
          </button>
        ))}
      </div>

      {/* Plugin Info */}
      {selectedPlugin && (
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Routes: {plugins.find(p => p.name === selectedPlugin)?.routes.join(', ') || '(none)'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {plugins.find(p => p.name === selectedPlugin)?.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => {
                  const plugin = plugins.find(p => p.name === selectedPlugin);
                  if (plugin) {
                    handleTogglePlugin(selectedPlugin, !plugin.enabled);
                  }
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  plugins.find(p => p.name === selectedPlugin)?.enabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    plugins.find(p => p.name === selectedPlugin)?.enabled
                      ? 'translate-x-4.5'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plugin UI */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedPlugin && workspace && (() => {
          const plugin = plugins.find(p => p.name === selectedPlugin);

          // Render React component if plugin has one
          if (plugin?.has_component) {
            return (
              <PluginComponentLoader
                key={`${selectedPlugin}-${refreshKey}`}
                pluginName={selectedPlugin}
                workspace={workspace}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            );
          }

          // Fallback to legacy JSON UI
          if (pluginUI && pluginUI.items.length > 0) {
            return (
              <div className="space-y-4">
                {pluginUI.items.map((item: PluginUIItem) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{item.id}</span>
                    </div>

                    {item.content && (
                      <pre className="mt-3 text-xs bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                        {item.content}
                      </pre>
                    )}

                    {item.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {item.actions.map((action) => (
                          <div key={action.action}>
                            {action.hasTextarea && (
                              <textarea
                                value={actionTextareas[`${item.id}_${action.action}`] || ''}
                                onChange={(e) =>
                                  setActionTextareas(prev => ({
                                    ...prev,
                                    [`${item.id}_${action.action}`]: e.target.value
                                  }))
                                }
                                placeholder="Enter your reply..."
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-2"
                                rows={3}
                              />
                            )}
                            <button
                              onClick={() =>
                                handleAction(selectedPlugin, action.action, item.id, action.hasTextarea)
                              }
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
                            >
                              {action.label}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div className="text-center text-gray-500 text-sm">
              {pluginUI ? 'No items to display' : 'Select a plugin to view its data'}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
