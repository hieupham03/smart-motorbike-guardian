import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { securityLabel } from "../../services/presentation";
const icon = L.divIcon({
  className: "custom-bike-marker",
  html: '<svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#0369a1" stroke="white" stroke-width="3"/><circle cx="18" cy="18" r="5" fill="white"/></svg>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
function Recenter({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  return null;
}
export default function LiveGpsMap({
  latitude = null,
  longitude = null,
  gpsValid = false,
  lastLocationReceivedAt = null,
  deviceName = "",
  licensePlate = "",
  speed = null,
  securityState = "PARKED",
  height = "420px",
}) {
  const [tileFailed, setTileFailed] = useState(false);
  const [tileVersion, setTileVersion] = useState(0);
  const hasLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !!lastLocationReceivedAt;
  const status =
    gpsValid && hasLocation
      ? "Vị trí mới cập nhật"
      : hasLocation
        ? "Vị trí cuối đã biết"
        : "Chưa xác định được vị trí";
  return (
    <div className="glass-card" style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.85rem",
        }}
      >
        <MapPin size={18} /> <strong>Vị trí xe · {status}</strong>
      </div>
      <p style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
        Cập nhật vị trí gần nhất:{" "}
        {lastLocationReceivedAt
          ? new Date(lastLocationReceivedAt).toLocaleString()
          : "Chưa từng nhận"}
      </p>
      {hasLocation && !gpsValid && (
        <p className="notice notice-warning">
          Đây là vị trí lần cuối đã nhận, không phải vị trí hiện tại.
        </p>
      )}
      {hasLocation && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
          target="_blank"
          rel="noopener"
          style={{ display: "inline-flex", alignItems: "center", minHeight: 44, marginBottom: "0.5rem" }}
        >
          Mở bản đồ lớn
        </a>
      )}
      {hasLocation && tileFailed && (
        <div className="notice notice-warning" role="status">
          <p>Chưa tải được đầy đủ nền bản đồ. Kiểm tra kết nối Internet hoặc mở bản đồ lớn.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setTileFailed(false); setTileVersion((version) => version + 1); }}
          >
            Tải lại bản đồ
          </button>
        </div>
      )}
      {hasLocation ? (
        <div style={{ height, borderRadius: "12px", overflow: "hidden" }}>
          <MapContainer
            center={[latitude, longitude]}
            zoom={16}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              key={tileVersion}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{ tileerror: () => setTileFailed(true) }}
            />
            <Recenter latitude={latitude} longitude={longitude} />
            <Marker
              position={[latitude, longitude]}
              icon={icon}
              opacity={gpsValid ? 1 : 0.5}
            >
              <Popup>
                <strong>{deviceName}</strong>
                <div>{licensePlate}</div>
                <div>{status}</div>
                <div>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
                <div>
                  Tốc độ: {Number.isFinite(speed) ? speed.toFixed(1) : "—"} km/h
                </div>
                <div>{securityLabel(securityState)}</div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        <div
          style={{
            height,
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
            textAlign: "center",
            color: "#475569",
            background: "#f1f5f9",
            borderRadius: "12px",
          }}
        >
          Đang chờ vị trí từ thiết bị trên xe. Tín hiệu định vị có thể yếu khi ở
          trong nhà.
        </div>
      )}
    </div>
  );
}
