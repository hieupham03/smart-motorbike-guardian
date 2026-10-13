import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { api } from '../services/api';
import { LineChart, Download, Calendar, Filter, Zap, Gauge, Award, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function TelemetryAnalyticsPage() {
  const { selectedDevice, telemetry } = useDevice();
  const [data, setData] = useState([]);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setData([]);
    async function loadHistory() {
      if (!selectedDevice) return;
      setLoading(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        let from = now - 86400; // 24h
        if (range === '1h') from = now - 3600;
        if (range === '7d') from = now - 7 * 86400;

        const res = await api.getTelemetryHistory(selectedDevice.deviceId, from, now);
        if (active && res.success && res.data) {
          setData(previous => {
            const rows = new Map(res.data.map(d => [d.readingId,d]));
            previous.filter(d => d.deviceId === selectedDevice.deviceId).forEach(d => rows.set(d.readingId,d));
            return [...rows.values()].sort((a,b) => a.ts-b.ts).slice(-5000);
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHistory();
    return () => { active = false; };
  }, [selectedDevice?.deviceId, range]);

  const handleExport = async () => {
    if (!selectedDevice) return;
    const now = Math.floor(Date.now() / 1000);
    let from = now - 86400;
    if (range === '1h') from = now - 3600;
    if (range === '7d') from = now - 7 * 86400;

    await api.exportTelemetryCsv(selectedDevice.deviceId, from, now);
  };

  useEffect(() => {
    if (!telemetry || telemetry.deviceId !== selectedDevice?.deviceId) return;
    setData(previous => [...previous.filter(d => d.readingId !== telemetry.readingId), telemetry].sort((a,b) => a.ts - b.ts).slice(-5000));
  }, [telemetry, selectedDevice?.deviceId]);

  const formattedChartData = data.map(d => ({
    time: d.ts ? new Date(d.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    speed: d.speedValid ? d.speedKmh : null,
    battery: d.dataSource === 'LEGACY' ? null : d.batteryV ?? null,
  }));

  // Calculations
  const speeds = data.filter(d => d.speedValid).map(d => d.speedKmh).filter(Number.isFinite);
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : null;
  const avgSpeed = speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length) : null;
  const batterySamples = data.filter(d => d.dataSource !== 'LEGACY').map(d => d.batteryV).filter(Number.isFinite);
  const averageBattery = batterySamples.length ? batterySamples.reduce((a,b) => a+b,0)/batterySamples.length : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <LineChart size={26} color="#0284c7" /> Lịch Sử Dữ Liệu &amp; Xuất Báo Cáo
          </h1>
          <p className="page-subtitle">
            Tối đa 5.000 mẫu gần nhất trong khoảng thời gian của xe {selectedDevice?.name}; CSV dùng cùng giới hạn.
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
            <Award size={16} /> NGUỒN DỮ LIỆU
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', marginTop: '6px' }}>
            {selectedDevice?.dataSource || 'UNKNOWN'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Telemetry nhận qua MQTT / WebSocket</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={16} /> TỐC ĐỘ CAO NHẤT
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7', marginTop: '6px' }}>
            {maxSpeed?.toFixed(1) ?? '—'} <span style={{ fontSize: '1rem', color: '#64748b' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Ngưỡng cảnh báo: {selectedDevice?.speedThresholdKmh || 80} km/h</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={16} /> TỐC ĐỘ TRUNG BÌNH
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {avgSpeed?.toFixed(1) ?? '—'} <span style={{ fontSize: '1rem', color: '#64748b' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Tổng số mẫu đo: {data.length} records</div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={16} /> ĐIỆN ÁP TRUNG BÌNH
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {averageBattery?.toFixed(2) ?? 'Chưa đo'} <span style={{ fontSize: '1rem', color: '#64748b' }}>V</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Đo ADC hardware chưa xác minh</div>
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
                <th>Thời gian nhận</th><th>Nguồn</th>
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
                  <td>{d.receivedAt ? new Date(d.receivedAt).toLocaleString() : 'N/A'}</td><td>{d.dataSource || 'LEGACY'}</td>
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
