// SentinelFusion AI - Centralized API Service Client with Local Offline Queueing

const API_BASE = '/api';

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Token storage helpers
export const getToken = (): string | null => localStorage.getItem('sentinel_jwt_token');
export const setToken = (token: string): void => localStorage.setItem('sentinel_jwt_token', token);
export const removeToken = (): void => localStorage.removeItem('sentinel_jwt_token');

// Offline mutation queue
export interface OfflineMutation {
  id: string;
  endpoint: string;
  method: string;
  body?: any;
  timestamp: string;
  description: string;
}

export const getOfflineQueue = (): OfflineMutation[] => {
  try {
    return JSON.parse(localStorage.getItem('sentinel_offline_queue') || '[]');
  } catch {
    return [];
  }
};

export const saveOfflineQueue = (queue: OfflineMutation[]): void => {
  localStorage.setItem('sentinel_offline_queue', JSON.stringify(queue));
};

export const queueOfflineMutation = (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>): void => {
  const queue = getOfflineQueue();
  queue.push({
    ...mutation,
    id: `MUT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
  });
  saveOfflineQueue(queue);
};

export const clearOfflineQueue = (): void => {
  localStorage.removeItem('sentinel_offline_queue');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, ensure Content-Type is json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Clear token on authentication expiration
      removeToken();
      // Only redirect if not already on login or landing
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
    }

    if (!res.ok) {
      let errDetail = 'An error occurred during network processing.';
      try {
        const errorJson = await res.json();
        errDetail = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
      } catch {
        errDetail = await res.text() || res.statusText;
      }
      throw {
        message: errDetail,
        status: res.status,
      } as ApiError;
    }

    // Check content type for CSV or blob
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      return (await res.blob()) as unknown as T;
    }

    return await res.json();
  } catch (error: any) {
    // Detect reachability error
    if (error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
      throw {
        message: 'Backend server is currently unreachable. System operating in local offline mode.',
        status: 0,
      } as ApiError;
    }
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { username_or_email: string; password: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request<any>('/auth/me', { method: 'GET' }),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
    seedDemo: () => request<any>('/auth/seed-demo-accounts', { method: 'POST' }),
  },

  // Health
  health: {
    checkLiveness: () => request<any>('/health', { method: 'GET' }),
    checkReadiness: () => request<any>('/health/ready', { method: 'GET' }),
  },

  // Reports
  reports: {
    list: (params: { zone?: string; source_type?: string; data_quality?: string; status_filter?: string; search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.zone) q.set('zone', params.zone);
      if (params.source_type) q.set('source_type', params.source_type);
      if (params.data_quality) q.set('data_quality', params.data_quality);
      if (params.status_filter) q.set('status_filter', params.status_filter);
      if (params.search) q.set('search', params.search);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));
      return request<any>(`/reports?${q.toString()}`, { method: 'GET' });
    },
    get: (reportId: string) => request<any>(`/reports/${reportId}`, { method: 'GET' }),
    create: (data: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(data) }),
    uploadCsv: (formData: FormData) => request<any>('/reports/upload-csv', { method: 'POST', body: formData }),
    getSchema: () => request<any>('/reports/schema', { method: 'GET' }),
    exportCsvUrl: (zone?: string, sourceType?: string) => {
      const token = getToken();
      const params = new URLSearchParams();
      if (zone) params.set('zone', zone);
      if (sourceType) params.set('source_type', sourceType);
      if (token) params.set('token', token);
      const q = params.toString();
      return `/api/reports/export-csv${q ? `?${q}` : ''}`;
    },
    downloadCsv: async (zone?: string, sourceType?: string) => {
      const token = getToken();
      const params = new URLSearchParams();
      if (zone) params.set('zone', zone);
      if (sourceType) params.set('source_type', sourceType);
      if (token) params.set('token', token);
      const url = `/api/reports/export-csv${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = 'Failed to export reports CSV';
        try {
          const err = await res.json();
          msg = err.detail || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      link.download = `sentinelfusion_sensor_reports_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(objUrl);
      document.body.removeChild(link);
    },
  },

  // Incidents
  incidents: {
    list: (params: { zone?: string; priority?: string; status_filter?: string; recommendation?: string; search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.zone) q.set('zone', params.zone);
      if (params.priority) q.set('priority', params.priority);
      if (params.status_filter) q.set('status_filter', params.status_filter);
      if (params.recommendation) q.set('recommendation', params.recommendation);
      if (params.search) q.set('search', params.search);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));
      return request<any>(`/incidents?${q.toString()}`, { method: 'GET' });
    },
    get: (incidentId: string) => request<any>(`/incidents/${incidentId}`, { method: 'GET' }),
    runCorrelation: () => request<any>('/incidents/run-correlation', { method: 'POST' }),
    separateReport: (incidentId: string, reportId: string, reason: string) => {
      const q = new URLSearchParams({ report_id: reportId, reason });
      return request<any>(`/incidents/${incidentId}/separate-report?${q.toString()}`, { method: 'POST' });
    },
  },

  // Human Review
  review: {
    getQueue: () => request<any>('/review/queue', { method: 'GET' }),
    decide: (incidentId: string, data: { action: string; resulting_priority?: string; resulting_status?: string; correction_reason?: string; reviewer_notes?: string }) =>
      request<any>(`/review/decide/${incidentId}`, { method: 'POST', body: JSON.stringify(data) }),
    getDecisions: (incidentId: string) => request<any[]>(`/review/decisions/${incidentId}`, { method: 'GET' }),
    requestVerification: (incidentId: string, data: { target_source_type: string; fictional_zone: string; specific_questions: string; priority: string }) =>
      request<any>(`/review/verification/${incidentId}`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Source Health
  sourceHealth: {
    getSources: () => request<any>('/source-health', { method: 'GET' }),
    sendHeartbeat: (sourceId: string) => request<any>(`/source-health/${sourceId}/heartbeat`, { method: 'POST' }),
    toggleStatus: (sourceId: string, newStatus: string) => {
      const q = new URLSearchParams({ new_status: newStatus });
      return request<any>(`/source-health/${sourceId}/toggle-status?${q.toString()}`, { method: 'POST' });
    },
  },

  // Situation Reports
  situationReports: {
    generate: (data: { title?: string; fictional_zone?: string; incident_ids?: string[]; include_contradictions?: boolean; include_audit_trail?: boolean }) =>
      request<any>('/situation-reports/generate', { method: 'POST', body: JSON.stringify(data) }),
    exportCsvUrl: (zone?: string) => {
      const token = getToken();
      const params = new URLSearchParams();
      if (zone) params.set('zone', zone);
      if (token) params.set('token', token);
      const q = params.toString();
      return `/api/situation-reports/export-csv${q ? `?${q}` : ''}`;
    },
    downloadCsv: async (zone?: string) => {
      const token = getToken();
      const params = new URLSearchParams();
      if (zone) params.set('zone', zone);
      if (token) params.set('token', token);
      const url = `/api/situation-reports/export-csv${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = 'Failed to export situation report CSV';
        try {
          const err = await res.json();
          msg = err.detail || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      link.download = `sentinelfusion_sitrep_${zone || 'ALL'}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(objUrl);
      document.body.removeChild(link);
    },
  },

  // Simulation Lab
  simulation: {
    getScenarios: () => request<any[]>('/simulation/scenarios', { method: 'GET' }),
    loadScenario: (scenarioId: string) => request<any>(`/simulation/load/${scenarioId}`, { method: 'POST' }),
    seedDemo: () => request<any>('/simulation/seed-demo', { method: 'POST' }),
    resetDemo: () => request<any>('/simulation/reset', { method: 'POST' }),
  },

  // Audit
  audit: {
    list: (params: { action?: string; target_type?: string; actor?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.action) q.set('action', params.action);
      if (params.target_type) q.set('target_type', params.target_type);
      if (params.actor) q.set('actor', params.actor);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));
      return request<any>(`/audit?${q.toString()}`, { method: 'GET' });
    },
  },

  // Security Centre
  security: {
    getStatus: () => request<any>('/security/status', { method: 'GET' }),
  },

  // Admin
  admin: {
    getUsers: () => request<any[]>('/admin/users', { method: 'GET' }),
    createUser: (data: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (userId: number, data: any) => request<any>(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getMetrics: () => request<any>('/admin/metrics', { method: 'GET' }),
  },

  // Tactical Radar Scope & Courses of Action (COA)
  tactical: {
    getRadarContacts: () => request<any>('/tactical/radar-contacts', { method: 'GET' }),
    executeCoa: (data: { contact_id: string; incident_id?: string; coa_id: string; coa_name: string; action_type: string; officer_justification: string }) =>
      request<any>('/tactical/execute-coa', { method: 'POST', body: JSON.stringify(data) }),
  },
};
