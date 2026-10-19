import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { devicesApi } from '@/api/devices.api';
import { normalizeApiError } from '@/api/errors';
import { SubmitButton } from '@/components/AuthForm';
import { useGuardian } from '@/devices/GuardianContext';
import { canManageDevice } from '@/security/permissions';
import { colors } from '@/theme/colors';
import type { DeviceConfigRequest, User } from '@/types/api';

export default function DeviceManagementScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const deviceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { devices, refresh } = useGuardian();
  const device = devices.find((item) => item.deviceId === deviceId);
  const allowed = canManageDevice(device?.currentUserRole ?? null);
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!device) return;
    const snapshot = {
      name: device.name ?? '', licensePlate: device.licensePlate ?? '', vehicleModel: device.vehicleModel ?? '',
      speedThresholdKmh: String(device.speedThresholdKmh ?? ''), batteryLowThresholdV: String(device.batteryLowThresholdV ?? ''), tiltThresholdDeg: String(device.tiltThresholdDeg ?? ''),
    };
    void Promise.resolve().then(() => setForm(snapshot));
  }, [device]);
  const loadUsers = useCallback(async () => {
    if (!deviceId || !allowed) return;
    try { setUsers((await devicesApi.users(deviceId)).data); }
    catch (cause) { setFeedback(normalizeApiError(cause).message); }
  }, [allowed, deviceId]);
  useEffect(() => { void Promise.resolve().then(loadUsers); }, [loadUsers]);

  if (!deviceId || !device) return <View style={styles.content}><Text>Không tìm thấy thiết bị.</Text></View>;
  if (!allowed) return <View style={styles.content}><Text style={styles.note}>Viewer chỉ có quyền xem, không thể sửa cấu hình hoặc quản lý người dùng.</Text></View>;

  const update = async () => {
    const numeric = (key: string) => {
      const value = form[key]?.trim();
      if (!value) return undefined;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Các ngưỡng phải là số không âm.');
      return parsed;
    };
    setBusy(true); setFeedback(null);
    try {
      const payload: DeviceConfigRequest = { name: form.name?.trim(), licensePlate: form.licensePlate?.trim(), vehicleModel: form.vehicleModel?.trim(), speedThresholdKmh: numeric('speedThresholdKmh'), batteryLowThresholdV: numeric('batteryLowThresholdV'), tiltThresholdDeg: numeric('tiltThresholdDeg') };
      await devicesApi.updateConfig(deviceId, payload); await refresh(); setFeedback('Đã cập nhật cấu hình backend.');
    } catch (cause) { setFeedback(normalizeApiError(cause).message); }
    finally { setBusy(false); }
  };
  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true); setFeedback(null);
    try { await devicesApi.inviteViewer(deviceId, email.trim()); setEmail(''); await loadUsers(); setFeedback('Đã cấp quyền Viewer.'); }
    catch (cause) { setFeedback(normalizeApiError(cause).message); }
    finally { setBusy(false); }
  };
  const remove = (user: User) => Alert.alert('Gỡ quyền Viewer?', user.email, [{ text: 'Hủy', style: 'cancel' }, { text: 'Gỡ quyền', style: 'destructive', onPress: async () => {
    try { await devicesApi.removeUser(deviceId, user.userId); await loadUsers(); }
    catch (cause) { setFeedback(normalizeApiError(cause).message); }
  } }]);

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.warning}>Các ngưỡng hiện được lưu và dùng ở backend; firmware chưa đồng bộ/apply cấu hình này.</Text>
    {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
    <View style={styles.card}><Text style={styles.heading}>Thông tin và ngưỡng</Text>
      {([['name','Tên xe'],['licensePlate','Biển số'],['vehicleModel','Dòng xe'],['speedThresholdKmh','Ngưỡng tốc độ (km/h)'],['batteryLowThresholdV','Ngưỡng pin thấp (V)'],['tiltThresholdDeg','Ngưỡng nghiêng (độ)']] as const).map(([key,label]) =>
        <View style={styles.field} key={key}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={form[key] ?? ''} keyboardType={key.includes('Threshold') ? 'decimal-pad' : 'default'} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))} /></View>)}
      <SubmitButton label="Lưu cấu hình" loading={busy} onPress={() => void update()} />
    </View>
    <View style={styles.card}><Text style={styles.heading}>Người được chia sẻ</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="viewer@example.com" />
      <Pressable style={styles.add} disabled={busy} onPress={() => void invite()}><Text style={styles.addText}>Thêm Viewer</Text></Pressable>
      {users.map((item) => <View key={item.userId} style={styles.user}><View><Text style={styles.userName}>{item.fullName}</Text><Text style={styles.muted}>{item.email} · {item.role}</Text></View>{item.role === 'VIEWER' && <Pressable onPress={() => remove(item)}><Text style={styles.remove}>Gỡ</Text></Pressable>}</View>)}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14 }, card: { borderRadius: 16, backgroundColor: colors.surface, padding: 16, gap: 12 }, heading: { color: colors.text, fontSize: 18, fontWeight: '900' },
  warning: { borderRadius: 10, backgroundColor: '#FFF7ED', color: '#9A3412', padding: 12, lineHeight: 20 }, note: { color: colors.textMuted }, feedback: { color: colors.primary, fontWeight: '700' },
  field: { gap: 5 }, label: { color: colors.text, fontWeight: '700' }, input: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 11, color: colors.text }, add: { alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary, padding: 12 }, addText: { color: '#FFF', fontWeight: '800' },
  user: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 }, userName: { color: colors.text, fontWeight: '800' }, muted: { color: colors.textMuted, fontSize: 12 }, remove: { color: colors.danger, fontWeight: '800' },
});
