// Plugin Component API Types

export interface PluginAPI {
  // Workspace context
  workspace: string;

  // Action handler - calls backend plugin handleAction
  action: (action: string, id: string, data?: Record<string, unknown>) => Promise<unknown>;

  // Refresh UI - useful for components that need to trigger a reload
  refresh: () => void;
}

export interface PluginComponentProps {
  api: PluginAPI;
}
