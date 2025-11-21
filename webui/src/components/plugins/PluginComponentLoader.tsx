import { useEffect, useState, useRef } from 'react';
import { PluginAPI } from '../../types/plugin';
import { api } from '../../utils/api';

interface PluginComponentLoaderProps {
  pluginName: string;
  workspace: string;
  onRefresh: () => void;
}

export function PluginComponentLoader({
  pluginName,
  workspace,
  onRefresh,
}: PluginComponentLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleLoaded, setModuleLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Effect 1: Load the module
  useEffect(() => {
    loadPluginModule();
  }, [pluginName, workspace]);

  // Effect 2: Create and append element once container is available
  useEffect(() => {
    if (!moduleLoaded || !containerRef.current || elementRef.current) {
      return;
    }

    console.log('[PluginLoader] Creating element for', pluginName);

    // Create the plugin API
    const pluginAPI: PluginAPI = {
      workspace,
      action: async (action: string, id: string, data: Record<string, unknown> = {}) => {
        return api.pluginAction(pluginName, action, id, data);
      },
      refresh: onRefresh,
    };

    // Create and append the custom element
    const customElementName = `${pluginName}-plugin`;
    const element = document.createElement(customElementName);
    console.log('[PluginLoader] Created element:', element);

    // Clear any existing content and append
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(element);
    elementRef.current = element;
    console.log('[PluginLoader] Element appended to DOM');

    // Set the api property AFTER appending (triggers Lit reactivity)
    (element as any).api = pluginAPI;
    console.log('[PluginLoader] API property set:', (element as any).api);
  }, [moduleLoaded, pluginName, workspace, onRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current && containerRef.current) {
        containerRef.current.removeChild(elementRef.current);
        elementRef.current = null;
      }
    };
  }, []);

  const loadPluginModule = async () => {
    try {
      setLoading(true);
      setError(null);
      setModuleLoaded(false);

      // Dynamically import the plugin component bundle as an ESM module
      const componentUrl = `/api/w/${workspace}/plugins/${pluginName}/component.js`;

      // Add timestamp to bust cache
      const url = `${componentUrl}?t=${Date.now()}`;

      // Import the module - this will register the custom element
      await import(/* @vite-ignore */ url);

      setModuleLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error(`Failed to load plugin component ${pluginName}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load plugin component');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-600">Loading {pluginName} component...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">
          Failed to Load Plugin Component
        </h3>
        <p className="text-xs text-yellow-700 mb-4">{error}</p>
        <button
          onClick={loadPluginModule}
          className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return <div ref={containerRef}></div>;
}
