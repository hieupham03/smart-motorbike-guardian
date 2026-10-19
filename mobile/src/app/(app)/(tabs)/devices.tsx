import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useGuardian } from '@/devices/GuardianContext';
import { colors } from '@/theme/colors';

export default function DevicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { devices, selectedDeviceId, selectDevice, loading, refresh } = useGuardian();
  if (loading) return <LoadingScreen label="Đang tải danh sách thiết bị..." />;
  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={devices}
      ListHeaderComponent={<View style={styles.tools}>
        <Pressable style={styles.tool} onPress={() => router.push('/(app)/onboard')}><Text style={styles.toolText}>+ Thêm thiết bị</Text></Pressable>
        <Pressable style={styles.tool} onPress={() => router.push('/(app)/history')}><Text style={styles.toolText}>Lịch sử / CSV</Text></Pressable>
        <Pressable style={styles.tool} onPress={() => router.push('/(app)/profile')}><Text style={styles.toolText}>Tài khoản</Text></Pressable>
        {user?.role === 'ADMIN' && <Pressable style={styles.tool} onPress={() => router.push('/(app)/admin')}><Text style={styles.toolText}>Quản trị</Text></Pressable>}
      </View>}
      keyExtractor={(item) => item.deviceId}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refresh()} />}
      ListEmptyComponent={<Text style={styles.empty}>Không có thiết bị được cấp quyền.</Text>}
      renderItem={({ item }) => {
        const active = item.deviceId === selectedDeviceId;
        return (
          <Pressable onPress={() => selectDevice(item.deviceId)} style={[styles.card, active && styles.active]}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.source, item.dataSource === 'HARDWARE' && styles.hardware]}>{item.dataSource}</Text>
            </View>
            <Text style={styles.detail}>{item.licensePlate || 'Chưa có biển số'} · {item.vehicleModel || 'Chưa có dòng xe'}</Text>
            <Text style={styles.detail}>{item.deviceUuid}</Text>
            <View style={styles.rowBottom}>
              <Text style={styles.state}>{item.securityState}</Text>
              <Text style={styles.role}>{item.currentUserRole || '—'}</Text>
            </View>
            {(item.currentUserRole === 'OWNER' || item.currentUserRole === 'ADMIN') && <Pressable style={styles.manage} onPress={() => router.push({ pathname: '/(app)/device/[id]', params: { id: item.deviceId } })}><Text style={styles.manageText}>Quản lý cấu hình & Viewer</Text></Pressable>}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 },
  active: { borderColor: colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowBottom: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' },
  name: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '900' },
  source: { borderRadius: 999, backgroundColor: '#F1F5F9', color: colors.textMuted, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  hardware: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  detail: { marginTop: 6, color: colors.textMuted, fontSize: 12 },
  state: { color: colors.primary, fontWeight: '900' },
  role: { color: colors.textMuted, fontWeight: '700' },
  empty: { marginTop: 60, color: colors.textMuted, textAlign: 'center' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tool: { borderRadius: 10, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 10 },
  toolText: { color: '#FFFFFF', fontWeight: '800' },
  manage: { marginTop: 12, alignItems: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.primary, padding: 9 },
  manageText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
});
