const API_BASE = '/api';
let refreshing;
export async function refreshAccessToken() {
  if (!refreshing) refreshing = (async () => {
    const response = await fetch(API_BASE + '/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }) });
    const result = await response.json();
    if (!response.ok || !result.data?.accessToken) {
      const error = new Error(result.message || 'Không thể làm mới phiên đăng nhập');
      error.status = response.status;
      throw error;
    }
    localStorage.setItem('accessToken', result.data.accessToken); localStorage.setItem('refreshToken', result.data.refreshToken);
    return result.data.accessToken;
  })().finally(() => { refreshing = null; });
  return refreshing;
}
export async function ensureAccessToken() {
  const token = localStorage.getItem('accessToken');
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (exp * 1000 > Date.now() + 45000) return token;
  } catch { /* renew below */ }
  return refreshAccessToken();
}
export async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = localStorage.getItem('accessToken');
  if (token) headers.Authorization = 'Bearer ' + token;
  let response = await fetch(API_BASE + endpoint, { ...options, headers });
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    try {
      headers.Authorization = 'Bearer ' + await refreshAccessToken();
      response = await fetch(API_BASE + endpoint, { ...options, headers });
    } catch (error) {
      if ([401, 403].includes(error.status)) {
        ['accessToken', 'refreshToken', 'currentUser'].forEach(key => localStorage.removeItem(key));
        window.dispatchEvent(new Event('guardian:logout'));
      }
      throw error;
    }
  }
  if (response.ok && response.headers.get('content-type')?.includes('text/csv')) return response.blob();
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Không thể xử lý yêu cầu');
    error.status = response.status;
    throw error;
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
  getLatestTelemetry: id => request(`/devices/${id}/telemetry/latest`),
  getTelemetryHistory: (deviceId, from, to, page = 0, size = 5000) => {
    let url = `/devices/${deviceId}/telemetry`;
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (from != null) params.append('from', from);
    if (to != null) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    return request(url);
  },
  exportTelemetryCsv: async (deviceId, from, to) => {
    let url = `/devices/${deviceId}/telemetry/export`;
    const params = new URLSearchParams();
    if (from != null) params.append('from', from);
    if (to != null) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    
    const blob = await request(url);
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `telemetry_${deviceId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
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
