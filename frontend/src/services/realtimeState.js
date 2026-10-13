export const initialRealtimeState = { devices: [], alerts: [], telemetry: {}, histories: {}, commands: {}, versions: {}, revoked: {}, version: 0, alertsVersion: 0 };
export function liveDeviceView(device, now = Date.now()) {
  if (!device) return null;
  const age = device.lastTelemetryAt ? now - Date.parse(device.lastTelemetryAt) : Infinity;
  const fresh = age >= -1000 && age <= 5000 && device.lifecycleState === 'ACTIVE';
  return { ...device,
    sensorConnected: !!(fresh && device.sensorConnected),
    speedValid: !!(fresh && device.speedValid),
    imuValid: !!(fresh && device.imuValid),
    gpsValid: !!(fresh && device.gpsValid && device.gpsAgeMs != null && device.gpsAgeMs + Math.max(0, age) <= 5000),
  };
}
const time = item => Date.parse(item?.receivedAt || item?.updatedAt || item?.createdAt || item?.issuedAt || '') || (item?.ts || 0) * 1000;
export function mergeReadings(old = [], incoming = []) {
  const rows = new Map(old.map(row => [row.readingId, row]));
  incoming.forEach(row => rows.set(row.readingId, row));
  return [...rows.values()].sort((a, b) => time(a) - time(b)).slice(-300);
}
export function mergeCommands(old = [], incoming = []) {
  const rows = new Map(old.map(row => [row.cmdId, row]));
  incoming.forEach(row => {
    const previous = rows.get(row.cmdId);
    // A slower HTTP response must never revert an ACK to PENDING.
    if (previous && previous.status !== 'PENDING' && row.status === 'PENDING') return;
    if (previous?.lateAckAt && !row.lateAckAt) return;
    rows.set(row.cmdId, row);
  });
  return [...rows.values()].sort((a, b) => time(b) - time(a)).slice(0, 100);
}
export function realtimeReducer(state, action) {
  if (action.type === 'RESET') return initialRealtimeState;
  if (action.type === 'DEVICES') {
    const old = new Map(state.devices.map(d => [d.deviceId, d]));
    return { ...state, devices: action.data.filter(d => !state.revoked[d.deviceId]).map(d => (state.versions[d.deviceId] || 0) > action.version ? old.get(d.deviceId) || d : d) };
  }
  if (action.type === 'ALERTS') {
    // Keep events received while the REST snapshot was in flight.
    const rows = new Map(action.data.filter(a => !state.revoked[a.deviceId]).map(a => [a.alertId, a]));
    if (state.alertsVersion > action.version) state.alerts.forEach(a => rows.set(a.alertId, a));
    return { ...state, alerts: [...rows.values()].sort((a, b) => time(b) - time(a)) };
  }
  const { type, deviceId: id, data } = action;
  if (!id || !data) return state;
  if (type === 'ACCESS_REMOVED') {
    const next = { ...state, revoked: { ...state.revoked, [id]: true }, devices: state.devices.filter(d => d.deviceId !== id), alerts: state.alerts.filter(a => a.deviceId !== id), telemetry: { ...state.telemetry }, histories: { ...state.histories }, commands: { ...state.commands } };
    delete next.telemetry[id]; delete next.histories[id]; delete next.commands[id];
    return next;
  }
  const version = state.version + 1;
  const next = { ...state, version, versions: { ...state.versions, [id]: version } };
  if (type === 'DEVICE') return { ...next, revoked: { ...state.revoked, [id]: false }, devices: state.devices.some(d => d.deviceId === id) ? state.devices.map(d => d.deviceId === id ? { ...d, ...data } : d) : [...state.devices, data] };
  if (state.revoked[id]) return state;
  if (type === 'TELEMETRY' || type === 'HISTORY') {
    const rows = mergeReadings(state.histories[id], type === 'HISTORY' ? data : [data]);
    return { ...next, histories: { ...state.histories, [id]: rows }, telemetry: { ...state.telemetry, [id]: rows.at(-1) || null } };
  }
  if (type === 'COMMAND' || type === 'COMMANDS') return { ...next, commands: { ...state.commands, [id]: mergeCommands(state.commands[id], type === 'COMMANDS' ? data : [data]) } };
  if (type === 'ALERT') return { ...next, alertsVersion: state.alertsVersion + 1, alerts: [data, ...state.alerts.filter(a => a.alertId !== data.alertId)].sort((a, b) => time(b) - time(a)) };
  return state;
}
