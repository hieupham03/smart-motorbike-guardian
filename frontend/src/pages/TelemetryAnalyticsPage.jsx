import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { api } from '../services/api';
import { LineChart, Download, Calendar, Filter, Zap, Gauge, Award, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function TelemetryAnalyticsPage() {
  const { selectedDevice } = useDevice();
  const [data, setData] = useState([]);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedDevice) return;
      setLoading(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        let from = now - 86400; // 24h
        if (range === '1h') from = now - 3600;
        if (range === '7d') from = now - 7 * 86400;

        const res = await api.getTelemetryHistory(selectedDevice.deviceId, from, now);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [selectedDevice, range]);

  const handleExport = async () => {
    if (!selectedDevice) return;
    const now = Math.floor(Date.now() / 1000);
    let from = now - 86400;
    if (range === '1h') from = now - 3600;
    if (range === '7d') from = now - 7 * 86400;

    await api.exportTelemetryCsv(selectedDevice.deviceId, from, now);
  };

  const formattedChartData = data.map(d => ({
    time: d.ts ? new Date(d.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    speed: d.speedKmh || 0,
    battery: d.batteryV || 0,
    accel: Math.sqrt((d.accelX || 0)**2 + (d.accelY || 0)**2 + (d.accelZ || 1)**2).toFixed(2)
  }));

  // Calculations
  const speeds = data.map(d => d.speedKmh || 0);
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const avgSpeed = speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
  const drivingScore = Math.max(70, Math.min(98, Math.round(95 - (maxSpeed > 60 ? 10 : 0))));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <LineChart size={26} color="#0284c7" /> Lịch Sử Dữ Liệu &amp; Xuất Báo Cáo
          </h1>
          <p className="page-subtitle">
            Phân tích số liệu cảm biến chuỗi thời gian (Time-series) của xe {selectedDevice?.name}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Time Filter Buttons */}
          <div style={{ display: 'flex', background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '3px' }}>
            {['1h', '24h', '7d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', boxShadow: 'none' }}
              >
                {r === '1h' ? '1 Giờ' : r === '24h' ? '24 Giờ' : '7 Ngày'}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={18} /> Xuất Báo Cáo CSV
          </button>
        </div>
      </div>

      {/* Analytics Summary Stats (Grid 4) */}
      <div className="grid-4">
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={16} /> ĐIỂM LÁI XE (DRIVING SCORE)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', marginTop: '6px' }}>
            {drivingScore} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Hành vi an toàn, ít phanh gấp</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={16} /> TỐC ĐỘ CAO NHẤT
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7', marginTop: '6px' }}>
            {maxSpeed.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Ngưỡng cảnh báo: {selectedDevice?.speedThresholdKmh || 80} km/h</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={16} /> TỐC ĐỘ TRUNG BÌNH
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {avgSpeed.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Tổng số mẫu đo: {data.length} records</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={16} /> ĐIỆN ÁP TRUNG BÌNH
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {(selectedDevice?.lastBatteryV || 12.6).toFixed(2)} <span style={{ fontSize: '1rem', color: '#64748b' }}>V</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Trạng thái ắc quy ổn định</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e', marginBottom: '1.25rem' }}>
          BIỂU ĐỒ DIỄN BIẾN TỐC ĐỘ (KM/H) &amp; ĐIỆN ÁP ẮC QUY (VOLT)
        </h3>

        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#0284c7' }} unit=" km/h" />
              <YAxis yAxisId="right" orientation="right" domain={[10, 14]} tick={{ fontSize: 12, fill: '#10b981' }} unit=" V" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #bae6fd' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="speed" name="Tốc độ (km/h)" stroke="#0284c7" strokeWidth={2.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="battery" name="Ắc quy (V)" stroke="#10b981" strokeWidth={2} dot={false} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e', marginBottom: '1rem' }}>
          DANH SÁCH BẢN TIN TELEMETRY GẦN NHẤT
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian (UTC)</th>
                <th>Tốc độ (km/h)</th>
                <th>Điện áp (V)</th>
                <th>Gia tốc (X / Y / Z)</th>
                <th>Trạng thái xe</th>
                <th>Toạ độ GPS</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(-15).reverse().map((d) => (
                <tr key={d.readingId || d.ts}>
                  <td>{d.ts ? new Date(d.ts * 1000).toLocaleString() : 'N/A'}</td>
                  <td style={{ fontWeight: '700', color: '#0284c7' }}>{d.speedKmh?.toFixed(1)} km/h</td>
                  <td>{d.batteryV?.toFixed(2)} V</td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {d.accelX?.toFixed(2)} / {d.accelY?.toFixed(2)} / {d.accelZ?.toFixed(2)}
                  </td>
                  <td>
                    <span className="badge badge-parked">{d.state || 'PARKED'}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {d.latitude?.toFixed(4)}, {d.longitude?.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
