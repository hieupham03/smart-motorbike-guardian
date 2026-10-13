import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { api } from '../services/api';
import { connectRealtime } from '../services/realtime';
import { initialRealtimeState, realtimeReducer, liveDeviceView } from '../services/realtimeState';
import { useAuth } from './AuthContext';

const DeviceContext = createContext(null);
export function DeviceProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [state, dispatch] = useReducer(realtimeReducer, initialRealtimeState);
  const stateRef = useRef(state); stateRef.current = state;
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isArming, setIsArming] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('DISCONNECTED');
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const generation = useRef(0);
  const selectedSnapshot = state.devices.find(d => d.deviceId === selectedId) || state.devices[0] || null;
  const selectedDevice = liveDeviceView(selectedSnapshot, Math.max(now, Date.now()));
  const selectedRef = useRef(selectedDevice?.deviceId); selectedRef.current = selectedDevice?.deviceId;

  // Recompute freshness locally even if the server or socket stops responding.
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    const version = stateRef.current.version, session = generation.current;
    try {
      const res = await api.getDevices();
      if (session !== generation.current) return;
      dispatch({ type: 'DEVICES', data: res.data || [], version }); setError(null);
    } catch (e) { if (session === generation.current) setError(e.message); }
    finally { if (session === generation.current) setLoading(false); }
  }, [isAuthenticated]);
  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    const version = stateRef.current.alertsVersion, session = generation.current;
    try {
      const res = await api.getAlerts();
      if (session === generation.current) dispatch({ type: 'ALERTS', data: res.data || [], version });
    } catch (e) { if (session === generation.current) setError(e.message); }
  }, [isAuthenticated]);
  const fetchSelected = useCallback(async (id = selectedRef.current) => {
    if (!id || !isAuthenticated) return;
    const session = generation.current;
    const results = await Promise.allSettled([api.getLatestTelemetry(id), api.getCommands(id)]);
    if (session !== generation.current) return;
    if (results[0].status === 'fulfilled' && results[0].value.data) dispatch({ type: 'TELEMETRY', deviceId: id, data: results[0].value.data });
    if (results[1].status === 'fulfilled') dispatch({ type: 'COMMANDS', deviceId: id, data: results[1].value.data || [] });
  }, [isAuthenticated]);

  useEffect(() => {
    generation.current += 1;
    dispatch({ type: 'RESET' }); setSelectedId(null); setLoading(isAuthenticated);
    if (!isAuthenticated) return;
    let active = true;
    fetchDevices(); fetchAlerts();
    const disconnect = connectRealtime({
      onEvent: event => { if (active) dispatch(event); },
      onStatus: status => { if (active) setRealtimeStatus(status); },
      onConnected: () => { if (active) { fetchDevices(); fetchAlerts(); fetchSelected(); } },
    });
    return () => { active = false; generation.current += 1; disconnect(); };
  }, [isAuthenticated, user?.userId, fetchDevices, fetchAlerts, fetchSelected]);

  // REST recovers snapshots only while the socket is unavailable.
  useEffect(() => {
    if (!isAuthenticated || realtimeStatus === 'CONNECTED') return;
    const timer = setInterval(() => { fetchDevices(); fetchAlerts(); fetchSelected(); }, 5000);
    return () => clearInterval(timer);
  }, [isAuthenticated, realtimeStatus, fetchDevices, fetchAlerts, fetchSelected]);

  useEffect(() => {
    const id = selectedDevice?.deviceId;
    if (!id) return;
    let active = true;
    fetchSelected(id);
    const end = Math.floor(Date.now() / 1000);
    api.getTelemetryHistory(id, end - 300, end).then(res => {
      if (active) dispatch({ type: 'HISTORY', deviceId: id, data: res.data || [] });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [selectedDevice?.deviceId, fetchSelected]);

  const sendDeviceCommand = async (type, payload = null, confirmationPassword = null) => {
    if (!selectedDevice) return;
    setIsArming(true);
    try {
      const res = await api.sendCommand(selectedDevice.deviceId, { type, payload, confirmationPassword });
      if (res.data) dispatch({ type: 'COMMAND', deviceId: selectedDevice.deviceId, data: res.data });
      return res;
    } finally { setIsArming(false); }
  };
  const id = selectedDevice?.deviceId;
  return <DeviceContext.Provider value={{
    devices: state.devices, selectedDevice,
    setSelectedDevice: device => setSelectedId(device?.deviceId || null), selectDeviceById: setSelectedId,
    telemetry: state.telemetry[id] || null, telemetryHistory: state.histories[id] || [], commands: state.commands[id] || [],
    alerts: state.alerts, unreadAlertsCount: state.alerts.filter(a => a.status === 'OPEN').length,
    loading, error, realtimeStatus, isArming, fetchDevices, fetchAlerts, sendDeviceCommand,
  }}>{children}</DeviceContext.Provider>;
}
export function useDevice() {
  const value = useContext(DeviceContext);
  if (!value) throw new Error('useDevice must be used within a DeviceProvider');
  return value;
}
