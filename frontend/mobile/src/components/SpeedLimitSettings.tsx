import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useGuardian } from '@/devices/GuardianContext';
import { commandFeedback, reasonLabel } from '@/devices/presentation';
import { parseSpeedLimit } from '@/devices/speedLimit';
import { canControlDevice } from '@/security/permissions';
import { normalizeApiError } from '@/api/errors';
import { ui } from '@/theme/userInterface';

export function SpeedLimitSettings() {
  const { selectedDevice: device, wheelSession: session, commands, commandPending, sendCommand } = useGuardian();
  const [value, setValue] = useState('');
  const [id, setId] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (device?.dataSource !== 'HARDWARE') return null;
  const allowed = canControlDevice(device.currentUserRole);
  // GuardianContext already expires the session and sensor validity every second.
  const fresh = session?.fresh && device.sensorConnected && device.lifecycleState === 'ACTIVE';
  const pending = commandPending || commands.some(c => c.status === 'PENDING');
  const ready = !!(allowed && fresh && session?.speedLimitConfigurable === true && !pending);
  const command = commands.find(c => c.cmdId === id);
  async function save() {
    if (!ready) return;
    const limit = parseSpeedLimit(value);
    if (limit === null) { setError('Nhập ngưỡng từ 1 đến 120 km/h.'); return; }
    setError(''); setId(null);
    try {
      const response = await sendCommand({ type: 'CONFIG_THRESHOLDS', payload: JSON.stringify({ speed_limit_kmh: limit }) });
      setId(response.cmdId);
    } catch (cause) { setError(reasonLabel(normalizeApiError(cause).message)); }
  }
  return <View style={{ gap: 12 }}>
    <Text style={ui.heading}>Ngưỡng cảnh báo tốc độ</Text>
    <Text style={ui.body}>Ngưỡng thiết bị báo về: {session && Number.isFinite(session.speedLimitKmh) ? `${session.speedLimitKmh.toLocaleString('vi-VN')} km/h` : 'Chưa có thông tin'}.</Text>
    {allowed ? <>
      <Text style={ui.label}>Ngưỡng mới (km/h)</Text>
      <TextInput accessibilityLabel="Ngưỡng mới (km/h)" style={ui.input} value={value}
        onChangeText={text => { setValue(text); setError(''); }} keyboardType="decimal-pad"
        editable={ready} onSubmitEditing={() => void save()} />
      <Pressable accessibilityRole="button" accessibilityLabel="Lưu ngưỡng cảnh báo" disabled={!ready}
        style={[ui.button, !ready && ui.disabled]} onPress={() => void save()}>
        <Text style={ui.buttonText}>Lưu ngưỡng cảnh báo</Text>
      </Pressable>
    </> : <Text style={ui.body}>Chỉ chủ xe hoặc quản trị viên được thay đổi ngưỡng.</Text>}
    <Text style={ui.caption}>Từ 1–120 km/h. Ngưỡng được lưu trên thiết bị, giữ lại sau khi tắt nguồn. Cảnh báo không tự giảm tốc hoặc khóa xe.</Text>
    {allowed && !pending && (!fresh
      ? <Text accessibilityLiveRegion="polite" style={ui.warning}>Chờ thiết bị kết nối và gửi dữ liệu mới để đổi ngưỡng.</Text>
      : !session?.speedLimitConfigurable && <Text accessibilityLiveRegion="polite" style={ui.warning}>Thiết bị chưa hỗ trợ đổi ngưỡng từ xa. Cần cập nhật phần mềm thiết bị.</Text>)}
    {command && <Text accessibilityLiveRegion="polite" style={command.status === 'REJECTED' || command.status === 'TIMEOUT' ? ui.warning : ui.info}>{commandFeedback(command)}</Text>}
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
  </View>;
}
