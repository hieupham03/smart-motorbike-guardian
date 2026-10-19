import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeviceSelector } from '@/components/DeviceSelector';
import { useGuardian } from '@/devices/GuardianContext';
import { getGpsPresentation } from '@/map/gps';
// Metro resolves the .native/.web implementation; TypeScript is declared in platform-modules.d.ts.
// eslint-disable-next-line import/no-unresolved
import { LiveMap } from '@/map/LiveMap';
import { colors } from '@/theme/colors';

export default function MapScreen() {
  const { selectedDevice, refresh } = useGuardian();
  const gps = getGpsPresentation(selectedDevice);
  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refresh()} />}>
      <Text style={styles.title}>Vị trí thiết bị</Text>
      <DeviceSelector />
      <View style={[styles.state, gps.state === 'FIX' ? styles.fix : gps.state === 'STALE' ? styles.stale : styles.noFix]}>
        <Text style={styles.stateTitle}>{gps.state}</Text>
        <Text style={styles.stateText}>
          {gps.state === 'FIX' && 'Vị trí GPS còn hợp lệ trong cửa sổ 5 giây.'}
          {gps.state === 'STALE' && 'Đang hiển thị vị trí hợp lệ gần nhất, không phải vị trí hiện tại.'}
          {gps.state === 'NO_FIX' && 'Thiết bị chưa từng gửi một GPS fix hợp lệ.'}
        </Text>
      </View>
      {gps.coordinate ? (
        <>
          <LiveMap latitude={gps.coordinate.latitude} longitude={gps.coordinate.longitude} stale={gps.state === 'STALE'} />
          <Text style={styles.coordinate}>{gps.coordinate.latitude.toFixed(6)}, {gps.coordinate.longitude.toFixed(6)}</Text>
        </>
      ) : (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>Không tạo marker hoặc tọa độ mặc định khi chưa có fix.</Text></View>
      )}
      <Text style={styles.note}>Tọa độ 0 là giá trị hợp lệ nếu nằm trong giới hạn địa lý. Ứng dụng dùng vị trí từ thiết bị, không dùng GPS của điện thoại.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 14 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  state: { borderRadius: 14, borderWidth: 1, padding: 14 },
  fix: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  stale: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  noFix: { borderColor: colors.border, backgroundColor: colors.surface },
  stateTitle: { color: colors.text, fontWeight: '900' },
  stateText: { marginTop: 4, color: colors.textMuted, lineHeight: 19 },
  coordinate: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  placeholder: { height: 260, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#E2E8F0', padding: 28 },
  placeholderText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
