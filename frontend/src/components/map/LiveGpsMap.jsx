import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
const icon = L.divIcon({ className: 'custom-bike-marker', html: '<span style="font-size:28px">🛵</span>', iconSize: [36, 36], iconAnchor: [18, 18] });
function Recenter({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => { map.setView([latitude, longitude], map.getZoom()); }, [latitude, longitude, map]);
  return null;
}
export default function LiveGpsMap({ latitude = null, longitude = null, gpsValid = false, lastLocationReceivedAt = null, deviceName = '', licensePlate = '', speed = null, securityState = 'PARKED', height = '420px' }) {
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 && !!lastLocationReceivedAt;
  const status = gpsValid && hasLocation ? 'FIX' : hasLocation ? 'STALE · Vị trí cuối đã nhận' : 'NO_FIX · Chưa có vị trí';
  return <div className="glass-card" style={{ padding: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}><MapPin size={18} /> <strong>ĐỊNH VỊ GPS · {status}</strong></div>
    <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>Nhận fix gần nhất: {lastLocationReceivedAt ? new Date(lastLocationReceivedAt).toLocaleString() : 'Chưa từng nhận'}</p>
    {hasLocation ? <div style={{ height, borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter latitude={latitude} longitude={longitude} />
        <Marker position={[latitude, longitude]} icon={icon} opacity={gpsValid ? 1 : 0.5}>
          <Popup><strong>{deviceName}</strong><div>{licensePlate}</div><div>{status}</div><div>{latitude.toFixed(6)}, {longitude.toFixed(6)}</div><div>Tốc độ: {Number.isFinite(speed) ? speed.toFixed(1) : '—'} km/h</div><div>{securityState}</div></Popup>
        </Marker>
      </MapContainer>
    </div> : <div style={{ height, display: 'grid', placeItems: 'center', background: '#f1f5f9', borderRadius: '12px' }}>Chờ GPS cung cấp tọa độ hợp lệ</div>}
  </div>;
}
