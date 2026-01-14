const API_BASE = '/api/admin';

/**
 * Create a fetch wrapper that includes auth token
 */
function createAuthFetch(getToken: () => string | null) {
  return async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Token expired or invalid - the auth context will handle refresh
      throw new Error('Unauthorized');
    }

    return response;
  };
}

export interface Monitor {
  id: number;
  name: string;
  type: string;
  url: string;
  group?: string;
  public: boolean;
  config?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
}

export interface AppSettings {
  title?: string;
  description?: string;
  logo_url?: string;
  timezone?: string;
  noindex?: boolean;
}

export interface NotificationSettings {
  webhook_url?: string;
  cooldown?: number;
  template?: string;
}

export interface Settings {
  id: number;
  app: AppSettings;
  notifications: NotificationSettings;
  updated_at: string;
}

export function createAdminApi(getToken: () => string | null) {
  const authFetch = createAuthFetch(getToken);

  return {
    // Monitor CRUD
    async getMonitors(): Promise<Monitor[]> {
      const response = await authFetch(`${API_BASE}/monitors`);
      if (!response.ok) {
        throw new Error('Failed to fetch monitors');
      }
      const data = await response.json();
      return data.monitors;
    },

    async getMonitor(id: number): Promise<Monitor> {
      const response = await authFetch(`${API_BASE}/monitors/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monitor');
      }
      const data = await response.json();
      return data.monitor;
    },

    async createMonitor(monitor: Omit<Monitor, 'id'>): Promise<Monitor> {
      const response = await authFetch(`${API_BASE}/monitors`, {
        method: 'POST',
        body: JSON.stringify(monitor),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create monitor');
      }
      const data = await response.json();
      return data.monitor;
    },

    async updateMonitor(id: number, updates: Partial<Monitor>): Promise<Monitor> {
      const response = await authFetch(`${API_BASE}/monitors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update monitor');
      }
      const data = await response.json();
      return data.monitor;
    },

    async deleteMonitor(id: number): Promise<void> {
      const response = await authFetch(`${API_BASE}/monitors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete monitor');
      }
    },

    async testMonitor(type: string, url: string, config?: Record<string, unknown>): Promise<{
      success: boolean;
      responseTime: number | null;
      error: string | null;
    }> {
      const response = await authFetch(`${API_BASE}/test-monitor`, {
        method: 'POST',
        body: JSON.stringify({ type, url, config }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test monitor');
      }
      return response.json();
    },

    // Settings
    async getSettings(): Promise<Settings> {
      const response = await authFetch(`${API_BASE}/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      return data.settings;
    },

    async updateSettings(app: AppSettings, notifications: NotificationSettings): Promise<Settings> {
      const response = await authFetch(`${API_BASE}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ app, notifications }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
      const data = await response.json();
      return data.settings;
    },

    // Utility
    async reloadMonitors(): Promise<{ message: string; count: number }> {
      const response = await authFetch(`${API_BASE}/reload-monitors`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reload monitors');
      }
      return response.json();
    },

    async aggregateStatus(): Promise<{ message: string }> {
      const response = await authFetch(`${API_BASE}/aggregate-status`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to aggregate status');
      }
      return response.json();
    },
  };
}
