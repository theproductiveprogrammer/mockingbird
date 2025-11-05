import { TrafficEntry, Rule, ServiceRules, Config, Stats } from '../types/api';

const API_BASE = 'http://localhost:8768/api';

class ApiClient {
  async getTraffic(limit = 100, service?: string): Promise<TrafficEntry[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (service) params.append('service', service);

    const response = await fetch(`${API_BASE}/traffic?${params}`);
    const data = await response.json();
    return data.entries || [];
  }

  async getTrafficById(id: string): Promise<TrafficEntry> {
    const response = await fetch(`${API_BASE}/traffic/${id}`);
    return response.json();
  }

  async getAllRules(): Promise<Record<string, ServiceRules>> {
    const response = await fetch(`${API_BASE}/rules`);
    const data = await response.json();
    return data.services || {};
  }

  async getServiceRules(service: string): Promise<ServiceRules> {
    const response = await fetch(`${API_BASE}/rules/${service}`);
    return response.json();
  }

  async createRule(service: string, rule: Rule): Promise<void> {
    const response = await fetch(`${API_BASE}/rules/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });

    if (!response.ok) {
      throw new Error('Failed to create rule');
    }
  }

  async updateRule(service: string, index: number, rule: Rule): Promise<void> {
    const response = await fetch(`${API_BASE}/rules/${service}/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });

    if (!response.ok) {
      throw new Error('Failed to update rule');
    }
  }

  async deleteRule(service: string, index: number): Promise<void> {
    const response = await fetch(`${API_BASE}/rules/${service}/${index}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete rule');
    }
  }

  async deleteService(service: string): Promise<void> {
    const response = await fetch(`${API_BASE}/rules/${service}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete service');
    }
  }

  async moveRule(service: string, index: number, direction: 'up' | 'down'): Promise<void> {
    const response = await fetch(`${API_BASE}/rules/${service}/${index}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });

    if (!response.ok) {
      throw new Error('Failed to move rule');
    }
  }

  async getConfig(): Promise<Config> {
    const response = await fetch(`${API_BASE}/config`);
    return response.json();
  }

  async setConfigValue(key: string, value: string): Promise<void> {
    const response = await fetch(`${API_BASE}/config/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error('Failed to set config value');
    }
  }

  async deleteConfigValue(key: string): Promise<void> {
    const response = await fetch(`${API_BASE}/config/${key}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete config value');
    }
  }

  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_BASE}/stats`);
    return response.json();
  }

  getTrafficStreamUrl(): string {
    return `${API_BASE}/traffic/stream`;
  }
}

export const api = new ApiClient();
