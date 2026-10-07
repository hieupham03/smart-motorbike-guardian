import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isArming, setIsArming] = useState(false);

  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getDevices();
      if (res.success && res.data) {
        setDevices(res.data);
        if (res.data.length > 0) {
          setSelectedDevice(prev => {
            if (!prev) return res.data[0];
            const updated = res.data.find(d => d.deviceId === prev.deviceId);
            return updated || res.data[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getAlerts();
      if (res.success && res.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [isAuthenticated]);

  // Periodic Telemetry & State Refresh (Every 2s for NFR-01 latency)
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDevices();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchDevices();
      fetchAlerts();
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchDevices, fetchAlerts]);

  const selectDeviceById = (deviceId) => {
    const found = devices.find(d => d.deviceId === deviceId);
    if (found) setSelectedDevice(found);
  };

  const sendDeviceCommand = async (type, payload = null, confirmationPassword = null) => {
    if (!selectedDevice) return;
    setIsArming(true);
    try {
      const res = await api.sendCommand(selectedDevice.deviceId, {
        type,
        payload,
        confirmationPassword
      });
      // Đợi 600ms để bản tin ACK từ Node A kịp về Backend và cập nhật Database
      await new Promise(r => setTimeout(r, 600));
      await fetchDevices();
      await fetchAlerts();
      return res;
    } finally {
      setIsArming(false);
    }
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <DeviceContext.Provider value={{
      devices,
      selectedDevice,
      setSelectedDevice,
      selectDeviceById,
      telemetry,
      alerts,
      unreadAlertsCount,
      loading,
      isArming,
      fetchDevices,
      fetchAlerts,
      sendDeviceCommand
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}
