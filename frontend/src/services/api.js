const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Handle Token Expiry / 401 Unauthorized
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          localStorage.setItem('accessToken', refreshData.data.accessToken);
          localStorage.setItem('refreshToken', refreshData.data.refreshToken);
          // Retry original request
          headers.Authorization = `Bearer ${refreshData.data.accessToken}`;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
          return retryRes.json();
        }
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }

  if (response.headers.get('content-type')?.includes('text/csv')) {
    return response.blob();
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đã xảy ra lỗi trong quá trình xử lý');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  changePassword: (oldPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
  getMe: () => request('/users/me'),

  // Devices
  getDevices: () => request('/devices'),
  getDeviceDetail: (id) => request(`/devices/${id}`),
  onboardDevice: (payload) => request('/devices/onboard', { method: 'POST', body: JSON.stringify(payload) }),
  updateConfig: (id, payload) => request(`/devices/${id}/config`, { method: 'PATCH', body: JSON.stringify(payload) }),
  revokeDevice: (id) => request(`/devices/${id}/revoke`, { method: 'POST' }),
  decommissionDevice: (id) => request(`/devices/${id}/decommission`, { method: 'POST' }),
  getDeviceUsers: (id) => request(`/devices/${id}/users`),
  inviteViewer: (id, payload) => request(`/devices/${id}/users`, { method: 'POST', body: JSON.stringify(payload) }),
  removeDeviceUser: (id, userId) => request(`/devices/${id}/users/${userId}`, { method: 'DELETE' }),

  // Commands
  sendCommand: (deviceId, payload) => request(`/devices/${deviceId}/command`, { method: 'POST', body: JSON.stringify(payload) }),
  getCommands: (deviceId) => request(`/devices/${deviceId}/commands`),

  // Telemetry
  getTelemetryHistory: (deviceId, from, to) => {
    let url = `/devices/${deviceId}/telemetry`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    return request(url);
  },
  exportTelemetryCsv: async (deviceId, from, to) => {
    let url = `/devices/${deviceId}/telemetry/export`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    
    const blob = await request(url);
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `telemetry_${deviceId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Alerts
  getAlerts: (deviceId, status) => {
    let url = '/alerts';
    const params = new URLSearchParams();
    if (deviceId) params.append('device_id', deviceId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return request(url);
  },
  acknowledgeAlert: (alertId) => request(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),
  resolveAlert: (alertId, actionTaken) => request(`/alerts/${alertId}/resolve`, { method: 'POST', body: JSON.stringify({ actionTaken }) }),

  // Admin
  getAdminUsers: () => request('/admin/users'),
  updateUserStatus: (userId, status) => request(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminDevices: () => request('/admin/devices'),
  getAuditLogs: () => request('/admin/audit-log'),

  // Hardware Simulator
  triggerSimulatorAction: (deviceId, action, value) => request('/simulator/action', { method: 'POST', body: JSON.stringify({ deviceId, action, value }) })
};
