import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeApiError } from '@/api/errors';
import { DeviceSelector } from '@/components/DeviceSelector';
import { useGuardian } from '@/devices/GuardianContext';
import { canResolveAlert } from '@/security/permissions';
import { colors } from '@/theme/colors';

export default function AlertsScreen() {
  const { alerts, devices, selectedDeviceId, acknowledgeAlert, resolveAlert } = useGuardian();
  const [onlySelected, setOnlySelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [actionTaken, setActionTaken] = useState('Đã kiểm tra và xử lý an toàn');
  const rows = useMemo(
    () => onlySelected ? alerts.filter((alert) => alert.deviceId === selectedDeviceId) : alerts,
    [alerts, onlySelected, selectedDeviceId],
  );

  const run = async (alertId: string, operation: () => Promise<void>) => {
    setBusyId(alertId);
    setError(null);
    try { await operation(); }
    catch (cause) { setError(normalizeApiError(cause).message); }
    finally { setBusyId(null); }
  };

  const canResolve = (deviceId: string) => {
    const role = devices.find((device) => device.deviceId === deviceId)?.currentUserRole;
    return canResolveAlert(role);
  };

  return (
    <>
      <FlatList
      contentContainerStyle={styles.container}
      data={rows}
      keyExtractor={(item) => item.alertId}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Cảnh báo</Text>
          <DeviceSelector />
          <Pressable onPress={() => setOnlySelected((value) => !value)} style={[styles.filter, onlySelected && styles.filterActive]}>
            <Text style={styles.filterText}>{onlySelected ? 'Đang lọc xe đã chọn' : 'Hiển thị tất cả xe'}</Text>
          </Pressable>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Không có cảnh báo phù hợp.</Text>}
      renderItem={({ item }) => (
        <View style={[styles.card, item.severity === 'CRITICAL' && styles.critical]}>
          <View style={styles.row}><Text style={styles.reason}>{item.reason}</Text><Text style={styles.severity}>{item.severity}</Text></View>
          <Text style={styles.device}>{item.deviceName} · {item.dataSource}</Text>
          {!!item.details && <Text style={styles.details}>{item.details}</Text>}
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.status}</Text>
          <View style={styles.actions}>
            {item.status === 'OPEN' && (
              <Pressable disabled={busyId === item.alertId} onPress={() => void run(item.alertId, () => acknowledgeAlert(item.alertId))} style={styles.ack}>
                <Text style={styles.ackText}>Đã xem</Text>
              </Pressable>
            )}
            {item.status !== 'RESOLVED' && canResolve(item.deviceId) && (
              <Pressable disabled={busyId === item.alertId} onPress={() => setResolveId(item.alertId)} style={styles.resolve}>
                <Text style={styles.resolveText}>Đánh dấu xử lý</Text>
              </Pressable>
            )}
          </View>
        </View>
        )}
      />
      <Modal transparent visible={!!resolveId} animationType="fade" onRequestClose={() => setResolveId(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Nội dung xử lý</Text>
          <TextInput multiline value={actionTaken} onChangeText={setActionTaken} style={styles.input} />
          <View style={styles.actions}>
            <Pressable onPress={() => setResolveId(null)} style={styles.ack}><Text>Hủy</Text></Pressable>
            <Pressable
              disabled={!actionTaken.trim()}
              onPress={() => {
                const id = resolveId;
                if (!id) return;
                setResolveId(null);
                void run(id, () => resolveAlert(id, actionTaken.trim()));
              }}
              style={[styles.resolve, !actionTaken.trim() && styles.disabled]}
            ><Text style={styles.resolveText}>Xác nhận</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 11 }, header: { gap: 12 }, title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  filter: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: '#CCFBF1' }, filterText: { color: colors.text, fontWeight: '700' },
  error: { borderRadius: 10, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 12 }, empty: { padding: 30, color: colors.textMuted, textAlign: 'center' },
  card: { borderLeftWidth: 4, borderLeftColor: colors.warning, borderRadius: 14, backgroundColor: colors.surface, padding: 15 },
  critical: { borderLeftColor: colors.danger }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  reason: { flex: 1, color: colors.text, fontWeight: '900' }, severity: { color: colors.danger, fontSize: 11, fontWeight: '900' },
  device: { marginTop: 5, color: colors.primary, fontWeight: '700' }, details: { marginTop: 8, color: colors.textMuted, lineHeight: 19 },
  time: { marginTop: 8, color: colors.textMuted, fontSize: 11 }, actions: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 },
  ack: { borderRadius: 9, backgroundColor: '#E2E8F0', paddingHorizontal: 13, paddingVertical: 9 }, ackText: { color: colors.text, fontWeight: '800' },
  resolve: { borderRadius: 9, backgroundColor: colors.primary, paddingHorizontal: 13, paddingVertical: 9 }, resolveText: { color: '#FFFFFF', fontWeight: '800' }, disabled: { opacity: 0.4 },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.7)', padding: 22 }, modalCard: { borderRadius: 18, backgroundColor: colors.surface, padding: 20 },
  modalTitle: { color: colors.text, fontSize: 19, fontWeight: '900' }, input: { minHeight: 90, marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, textAlignVertical: 'top' },
});
