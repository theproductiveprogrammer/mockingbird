import { TrafficEntry, Rule, ServiceRules, Config, Stats } from '../types/api';

// Helper to extract workspace from current URL
function getWorkspace(): string | null {
  const match = window.location.pathname.match(/^\/w\/([^\/]+)/);
  return match ? match[1] : null;
}

// Helper to get the correct API base path for the current workspace
function getApiBase(): string {
  const workspace = getWorkspace();
  return workspace ? `/api/w/${workspace}` : '/api';
}

export interface Workspace {
  name: string;
  created: string;
  rule_count: number;
  traffic_count: number;
  bird_icon: string;
}

// Plugin types
export interface Plugin {
  name: string;
  version: string;
  routes: string[];
  enabled: boolean;
  has_component: boolean;
}

export interface PluginUIAction {
  label: string;
  action: string;
  hasTextarea?: boolean;
}

export interface PluginUIItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  actions: PluginUIAction[];
}

export interface PluginUI {
  type: string;
  items: PluginUIItem[];
}

class ApiClient {
  // Workspace Management APIs (root level - no workspace in path)
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch('/api/workspaces');
    const data = await response.json();
    return data.workspaces || [];
  }

  async createWorkspace(name: string): Promise<void> {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create workspace');
    }
  }

  async deleteWorkspace(name: string): Promise<void> {
    const response = await fetch(`/api/workspaces/${name}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete workspace');
    }
  }

  async enableWorkspace(name: string): Promise<void> {
    const response = await fetch(`/api/workspaces/${name}/enable`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to enable workspace');
    }
  }

  async duplicateWorkspace(source: string, dest: string): Promise<void> {
    const response = await fetch(`/api/workspaces/${source}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dest }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to duplicate workspace');
    }
  }

  // Workspace-specific APIs (use workspace path)
  async getTraffic(limit = 100, service?: string): Promise<{ entries: TrafficEntry[]; returned: number; total: number }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (service) params.append('service', service);

    const response = await fetch(`${getApiBase()}/traffic?${params}`);
    const data = await response.json();
    return {
      entries: data.entries || [],
      returned: data.returned || 0,
      total: data.total || 0,
    };
  }

  async getTrafficById(id: string): Promise<TrafficEntry> {
    const response = await fetch(`${getApiBase()}/traffic/${id}`);
    return response.json();
  }

  async getAllRules(): Promise<Record<string, ServiceRules>> {
    const response = await fetch(`${getApiBase()}/rules`);
    const data = await response.json();
    return data.services || {};
  }

  async getServiceRules(service: string): Promise<ServiceRules> {
    const response = await fetch(`${getApiBase()}/rules/${service}`);
    return response.json();
  }

  async createRule(service: string, rule: Rule): Promise<void> {
    const response = await fetch(`${getApiBase()}/rules/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });

    if (!response.ok) {
      throw new Error('Failed to create rule');
    }
  }

  async updateRule(service: string, index: number, rule: Rule): Promise<void> {
    const response = await fetch(`${getApiBase()}/rules/${service}/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });

    if (!response.ok) {
      throw new Error('Failed to update rule');
    }
  }

  async deleteRule(service: string, index: number): Promise<void> {
    const response = await fetch(`${getApiBase()}/rules/${service}/${index}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete rule');
    }
  }

  async deleteService(service: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/rules/${service}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete service');
    }
  }

  async moveRule(service: string, index: number, direction: 'up' | 'down'): Promise<void> {
    const response = await fetch(`${getApiBase()}/rules/${service}/${index}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });

    if (!response.ok) {
      throw new Error('Failed to move rule');
    }
  }

  async getConfig(): Promise<Config> {
    const response = await fetch(`${getApiBase()}/config`);
    return response.json();
  }

  async setConfigValue(key: string, value: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/config/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error('Failed to set config value');
    }
  }

  async deleteConfigValue(key: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/config/${key}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete config value');
    }
  }

  async getStats(): Promise<Stats> {
    const response = await fetch(`${getApiBase()}/stats`);
    return response.json();
  }

  getTrafficStreamUrl(): string {
    return `${getApiBase()}/traffic/stream`;
  }

  // Plugin APIs
  async getPlugins(): Promise<Plugin[]> {
    const response = await fetch(`${getApiBase()}/plugins`);
    const data = await response.json();
    return data.plugins || [];
  }

  async getPluginUI(pluginName: string): Promise<PluginUI> {
    const response = await fetch(`${getApiBase()}/plugins/${pluginName}/ui`);
    return response.json();
  }

  async pluginAction(pluginName: string, action: string, id: string, data: Record<string, unknown> = {}): Promise<unknown> {
    const response = await fetch(`${getApiBase()}/plugins/${pluginName}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, data }),
    });

    if (!response.ok) {
      throw new Error('Plugin action failed');
    }

    return response.json();
  }

  async togglePlugin(pluginName: string, enabled: boolean): Promise<void> {
    const response = await fetch(`${getApiBase()}/plugins/${pluginName}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle plugin');
    }
  }
}

export const api = new ApiClient();
