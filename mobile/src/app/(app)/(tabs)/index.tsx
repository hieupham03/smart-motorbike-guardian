import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeviceSelector } from '@/components/DeviceSelector';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useGuardian } from '@/devices/GuardianContext';
import { colors } from '@/theme/colors';

function valueOrDash(value: number | null | undefined, digits = 1) {
  return value == null || !Number.isFinite(value) ? '—' : value.toFixed(digits);
}

function StatusPill({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return <Text style={[styles.pill, { backgroundColor: ok ? '#DCFCE7' : '#F1F5F9', color: ok ? '#166534' : '#475569' }]}>{ok ? yes : no}</Text>;
}

export default function DashboardScreen() {
  const { selectedDevice, telemetry, realtimeStatus, loading, error, refresh } = useGuardian();
  if (loading) return <LoadingScreen label="Đang tải thiết bị..." />;
  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refresh()} />}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>SMART MOTORBIKE</Text>
          <Text style={styles.title}>Tổng quan trực tiếp</Text>
        </View>
        <Text style={[styles.socket, realtimeStatus === 'CONNECTED' && styles.socketConnected]}>{realtimeStatus}</Text>
      </View>
      <DeviceSelector />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!selectedDevice ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Chưa có thiết bị</Text>
          <Text style={styles.muted}>Onboard thiết bị hoặc yêu cầu Owner cấp quyền.</Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.heroInfo}>
              <Text style={styles.deviceName}>{selectedDevice.name}</Text>
              <Text style={styles.heroSub}>{selectedDevice.licensePlate || selectedDevice.deviceUuid}</Text>
            </View>
            <View style={styles.speedWrap}>
              <Text style={styles.speed}>{selectedDevice.speedValid ? valueOrDash(telemetry?.speedKmh ?? selectedDevice.lastSpeedKmh) : '—'}</Text>
              <Text style={styles.unit}>km/h</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <StatusPill ok={selectedDevice.lifecycleState === 'ACTIVE'} yes="Gateway online" no="Gateway offline" />
            <StatusPill ok={selectedDevice.sensorConnected} yes="Sensor mới" no="Sensor stale" />
            <StatusPill ok={selectedDevice.gpsValid} yes="GPS FIX" no={selectedDevice.lastLatitude != null ? 'GPS STALE' : 'GPS NO FIX'} />
          </View>
          <View style={styles.grid}>
            <View style={styles.card}><Text style={styles.cardLabel}>Bảo vệ</Text><Text style={styles.cardValue}>{selectedDevice.securityState}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Nguồn dữ liệu</Text><Text style={styles.cardValue}>{selectedDevice.dataSource}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Gia tốc X</Text><Text style={styles.cardValue}>{selectedDevice.imuValid ? `${valueOrDash(telemetry?.accelX)} m/s²` : '—'}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Gia tốc Y</Text><Text style={styles.cardValue}>{selectedDevice.imuValid ? `${valueOrDash(telemetry?.accelY)} m/s²` : '—'}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Gia tốc Z</Text><Text style={styles.cardValue}>{selectedDevice.imuValid ? `${valueOrDash(telemetry?.accelZ)} m/s²` : '—'}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Điện áp</Text><Text style={styles.cardValue}>{telemetry?.batteryV == null ? 'Chưa đo' : `${valueOrDash(telemetry.batteryV, 2)} V`}</Text></View>
          </View>
          <Text style={styles.note}>Dữ liệu sensor chỉ hợp lệ trong 5 giây sau telemetry mới nhất. PARKED không tự chứng minh bánh xe đang đứng yên.</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 3, color: colors.text, fontSize: 25, fontWeight: '900' },
  socket: { borderRadius: 999, backgroundColor: '#E2E8F0', color: '#475569', paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '900' },
  socketConnected: { backgroundColor: '#DCFCE7', color: '#166534' },
  error: { borderRadius: 10, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 12 },
  empty: { borderRadius: 16, backgroundColor: colors.surface, padding: 24, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  muted: { marginTop: 5, color: colors.textMuted, textAlign: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, backgroundColor: colors.surfaceDark, padding: 20 },
  heroInfo: { flex: 1 },
  deviceName: { color: '#F8FAFC', fontSize: 21, fontWeight: '900' },
  heroSub: { marginTop: 6, color: '#94A3B8', fontSize: 12 },
  speedWrap: { alignItems: 'flex-end' },
  speed: { color: colors.primaryBright, fontSize: 38, fontWeight: '900' },
  unit: { color: '#94A3B8', fontSize: 11 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', minHeight: 92, borderRadius: 14, backgroundColor: colors.surface, padding: 14 },
  cardLabel: { color: colors.textMuted, fontSize: 12 },
  cardValue: { marginTop: 8, color: colors.text, fontSize: 17, fontWeight: '800' },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
