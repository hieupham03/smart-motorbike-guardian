import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';

// Custom Leaflet Motorbike Icon
const motorbikeIcon = L.divIcon({
  className: 'custom-bike-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
      font-size: 18px;
    ">
      🛵
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function LiveGpsMap({
  latitude = 21.028511,
  longitude = 105.854444,
  deviceName = 'Honda SH 150i',
  licensePlate = '29B1-888.88',
  speed = 0,
  securityState = 'PARKED',
  height = '420px'
}) {
  const position = [latitude || 21.028511, longitude || 105.854444];

  return (
    <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={18} color="#0284c7" />
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0c4a6e' }}>
            VỊ TRÍ & ĐỊNH VỊ GPS THỜI GIAN THỰC
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
          Tọa độ: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
        </div>
      </div>

      <div style={{ height: height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #bae6fd' }}>
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={position} />
          
          {/* Safe Geofence Zone Circle */}
          <Circle
            center={position}
            radius={80}
            pathOptions={{ fillColor: '#38bdf8', fillOpacity: 0.15, color: '#0284c7', weight: 1.5, dashArray: '4' }}
          />

          <Marker position={position} icon={motorbikeIcon}>
            <Popup>
              <div style={{ padding: '4px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: '800', color: '#0c4a6e' }}>{deviceName}</div>
                <div style={{ color: '#0284c7', fontWeight: '700' }}>Biển số: {licensePlate}</div>
                <div style={{ marginTop: '4px', color: '#475569' }}>
                  Tốc độ: <strong>{speed.toFixed(1)} km/h</strong>
                </div>
                <div style={{ color: '#475569' }}>
                  Trạng thái: <strong>{securityState}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
