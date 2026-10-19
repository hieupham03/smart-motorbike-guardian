import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeApiError } from '@/api/errors';
import { DeviceSelector } from '@/components/DeviceSelector';
import { useGuardian } from '@/devices/GuardianContext';
import { canControlDevice } from '@/security/permissions';
import { colors } from '@/theme/colors';
import type { CommandType } from '@/types/api';

const commands: { type: CommandType; label: string; danger?: boolean }[] = [
  { type: 'ARM', label: 'Bật bảo vệ' },
  { type: 'DISARM', label: 'Tắt bảo vệ' },
  { type: 'LOCK_ENGINE', label: 'Khóa động cơ', danger: true },
  { type: 'UNLOCK_ENGINE', label: 'Mở khóa động cơ' },
  { type: 'SIREN_ON', label: 'Bật còi', danger: true },
  { type: 'SIREN_OFF', label: 'Tắt còi' },
  { type: 'REBOOT', label: 'Khởi động lại', danger: true },
];

export default function ControlScreen() {
  const { selectedDevice, commands: history, sendCommand, commandPending } = useGuardian();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lockPassword, setLockPassword] = useState('');
  const [lockOpen, setLockOpen] = useState(false);
  const canControl = canControlDevice(selectedDevice?.currentUserRole);
  const deviceReady = selectedDevice?.lifecycleState === 'ACTIVE';

  const execute = async (type: CommandType, confirmationPassword?: string) => {
    setError(null);
    setFeedback(null);
    try {
      const result = await sendCommand({ type, confirmationPassword });
      setFeedback(`Lệnh ${result.type} đang ở trạng thái ${result.status}; chờ ACK từ firmware.`);
    } catch (cause) {
      setError(normalizeApiError(cause).message);
    }
  };

  const requestCommand = (type: CommandType) => {
    if (type === 'LOCK_ENGINE') {
      setLockOpen(true);
      return;
    }
    Alert.alert('Xác nhận lệnh', `Gửi lệnh ${type} tới ${selectedDevice?.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gửi', style: type === 'REBOOT' || type === 'SIREN_ON' ? 'destructive' : 'default', onPress: () => void execute(type) },
    ]);
  };

  return (
    <>
      <FlatList
      contentContainerStyle={styles.container}
      data={history.slice(0, 20)}
      keyExtractor={(item) => item.cmdId}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Điều khiển</Text>
          <DeviceSelector />
          {!canControl && <Text style={styles.warning}>Viewer chỉ được xem. Backend vẫn kiểm tra quyền nếu API bị gọi trực tiếp.</Text>}
          {canControl && !deviceReady && <Text style={styles.warning}>Thiết bị không ACTIVE; lệnh được khóa trên giao diện.</Text>}
          {!!feedback && <Text style={styles.success}>{feedback}</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.commandGrid}>
            {commands.map((command) => (
              <Pressable
                key={command.type}
                disabled={!canControl || !deviceReady || commandPending}
                onPress={() => requestCommand(command.type)}
                style={({ pressed }) => [styles.command, command.danger && styles.commandDanger, (!canControl || !deviceReady || commandPending) && styles.disabled, pressed && styles.pressed]}
              >
                <Text style={[styles.commandText, command.danger && styles.commandDangerText]}>{command.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Chưa có lệnh nào.</Text>}
      renderItem={({ item }) => (
        <View style={styles.historyItem}>
          <View style={styles.row}><Text style={styles.historyType}>{item.type}</Text><Text style={styles.historyStatus}>{item.status}</Text></View>
          <Text style={styles.historyTime}>{new Date(item.issuedAt).toLocaleString('vi-VN')}</Text>
          {!!item.reasonIfFailed && <Text style={styles.reason}>{item.reasonIfFailed}</Text>}
          {!!item.lateAckAt && <Text style={styles.late}>ACK muộn: {item.lateAckResult || 'UNKNOWN'} · trạng thái vẫn {item.status}</Text>}
        </View>
      )}
        ListFooterComponent={<Text style={styles.note}>Không tự gửi lại lệnh sau timeout. MQTT publish thành công chưa phải EXECUTED.</Text>}
      />
      <Modal transparent visible={lockOpen} animationType="fade" onRequestClose={() => setLockOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận khóa động cơ</Text>
            <Text style={styles.modalText}>Nhập lại mật khẩu. Firmware vẫn từ chối khóa nếu tốc độ không bằng 0 hoặc sensor không hợp lệ.</Text>
            <TextInput secureTextEntry value={lockPassword} onChangeText={setLockPassword} placeholder="Mật khẩu" style={styles.input} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setLockOpen(false)} style={styles.cancel}><Text>Hủy</Text></Pressable>
              <Pressable
                disabled={!lockPassword || commandPending}
                onPress={() => {
                  const password = lockPassword;
                  setLockPassword('');
                  setLockOpen(false);
                  void execute('LOCK_ENGINE', password);
                }}
                style={[styles.confirm, (!lockPassword || commandPending) && styles.disabled]}
              ><Text style={styles.confirmText}>Gửi lệnh khóa</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 10 }, header: { gap: 14 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  warning: { borderRadius: 10, backgroundColor: '#FFFBEB', color: '#92400E', padding: 12 },
  success: { borderRadius: 10, backgroundColor: '#F0FDF4', color: '#166534', padding: 12 },
  error: { borderRadius: 10, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 12 },
  commandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  command: { width: '48%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#CCFBF1', padding: 9 },
  commandDanger: { backgroundColor: '#FEE2E2' }, commandText: { color: '#115E59', fontWeight: '800', textAlign: 'center' },
  commandDangerText: { color: '#991B1B' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.75 },
  sectionTitle: { marginTop: 8, color: colors.text, fontSize: 18, fontWeight: '900' },
  historyItem: { borderRadius: 13, backgroundColor: colors.surface, padding: 14 }, row: { flexDirection: 'row', justifyContent: 'space-between' },
  historyType: { color: colors.text, fontWeight: '900' }, historyStatus: { color: colors.primary, fontWeight: '900' },
  historyTime: { marginTop: 5, color: colors.textMuted, fontSize: 12 }, reason: { marginTop: 6, color: colors.danger },
  late: { marginTop: 6, color: colors.warning, fontSize: 12 }, empty: { padding: 24, color: colors.textMuted, textAlign: 'center' },
  note: { marginVertical: 16, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.7)', padding: 22 },
  modalCard: { borderRadius: 18, backgroundColor: colors.surface, padding: 20 }, modalTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  modalText: { marginTop: 8, color: colors.textMuted, lineHeight: 19 }, input: { marginTop: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  modalActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }, cancel: { padding: 12 },
  confirm: { borderRadius: 10, backgroundColor: colors.danger, padding: 12 }, confirmText: { color: '#FFFFFF', fontWeight: '800' },
});
