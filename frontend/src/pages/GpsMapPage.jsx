import React from 'react';
import { useDevice } from '../context/DeviceContext';
import LiveGpsMap from '../components/map/LiveGpsMap';
export default function GpsMapPage() {
  const { selectedDevice: device } = useDevice();
  if (!device) return <div className="glass-card">Vui lòng chọn thiết bị để xem vị trí.</div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <h1 className="page-title">Bản đồ GPS · {device.name}</h1>
    <p className="page-subtitle">Nguồn: {device.dataSource} · Vị trí cập nhật qua WebSocket</p>
    <LiveGpsMap latitude={device.lastLatitude} longitude={device.lastLongitude} gpsValid={device.gpsValid} lastLocationReceivedAt={device.lastLocationReceivedAt} deviceName={device.name} licensePlate={device.licensePlate} speed={device.speedValid ? device.lastSpeedKmh : null} securityState={device.securityState} height="560px" />
  </div>;
}
