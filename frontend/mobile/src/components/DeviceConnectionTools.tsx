import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { devicesApi, type DeviceMqttCredentials } from '@/api/devices.api';
import { adminApi } from '@/api/admin.api';
import { normalizeApiError } from '@/api/errors';
import { confirmAction } from '@/components/confirmAction';
import { ui } from '@/theme/userInterface';
import type { Device } from '@/types/api';

export function DeviceConnectionTools({ device, admin, onRefresh }: {
  device: Device | null | undefined;
  admin: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [credential, setCredential] = useState<DeviceMqttCredentials | null>(null);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('Thiết bị mới');
  const [claim, setClaim] = useState<Device | null>(null);
  const rotate = (reactivate = false) => {
    if (!device || busy) return;
    confirmAction(reactivate ? 'Kích hoạt lại thiết bị?' : 'Cấp lại khóa kết nối?', reactivate ? 'Cấp khóa mới để khôi phục thiết bị đã thu hồi. Khóa cũ không dùng lại được; cần cập nhật firmware.' : 'Kết nối hiện tại sẽ bị ngắt. Cần cập nhật khóa mới trong firmware để thiết bị kết nối lại.', () => {
      void (async () => {
        setBusy(true); setCredential(null); setVisible(false); setMessage('');
        try {
          setCredential((await (reactivate ? devicesApi.reactivate(device.deviceId) : devicesApi.rotateCredentials(device.deviceId))).data);
          setMessage('Khóa chỉ hiển thị trong lần cấp này. Lưu riêng; không đưa vào GitHub, ảnh hoặc video demo.');
          await onRefresh();
        } catch (error) { setMessage(normalizeApiError(error).message); }
        finally { setBusy(false); }
      })();
    }, true);
  };
  const provision = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setClaim(null); setMessage('');
    try {
      setClaim((await adminApi.provisionDevice(name.trim())).data);
      setMessage('Đã đăng ký thiết bị chưa kích hoạt. Chỉ nhận dữ liệu thật sau khi cấu hình đúng UUID và khóa trên board.');
      await onRefresh();
    } catch (error) { setMessage(normalizeApiError(error).message); }
    finally { setBusy(false); }
  };
  return <View style={ui.card}>
    <Text style={ui.heading}>Cấp kết nối thiết bị</Text>
    <Text style={ui.body}>Dành cho chủ xe/quản trị viên khi lắp đặt hoặc thay khóa. Mỗi thiết bị dùng một khóa riêng.</Text>
    {device?.dataSource === 'HARDWARE' && device.lifecycleState !== 'DECOMMISSIONED' &&
      <Pressable accessibilityRole="button" disabled={busy} style={ui.button} onPress={() => rotate(device.lifecycleState === 'FAULT')}>
        <Text style={ui.buttonText}>{busy ? 'Đang xử lý…' : device.lifecycleState === 'FAULT' ? 'Kích hoạt lại và cấp khóa mới' : 'Cấp lại khóa kết nối'}</Text>
      </Pressable>}
    {!!message && <Text accessibilityLiveRegion="polite" style={ui.body}>{message}</Text>}
    {credential && <View>
      <Text selectable style={ui.body}>Username: {credential.username}{'\n'}Broker: {credential.brokerHost}:{credential.brokerPort}</Text>
      <Text style={ui.caption}>Khóa kết nối mới</Text>
      <TextInput accessibilityLabel="Khóa kết nối mới" value={credential.password} editable={false} secureTextEntry={!visible} style={ui.input} autoComplete="off" />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: visible }} style={[ui.button, ui.secondary]} onPress={() => setVisible(v => !v)}>
        <Text style={ui.secondaryText}>{visible ? 'Ẩn khóa' : 'Hiện khóa'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={[ui.button, ui.secondary]} onPress={() => { setCredential(null); setVisible(false); }}>
        <Text style={ui.secondaryText}>Xóa khỏi màn hình</Text>
      </Pressable>
    </View>}
    {admin && <View>
      <Text style={ui.heading}>Đăng ký board mới</Text>
      <TextInput accessibilityLabel="Tên thiết bị mới" value={name} onChangeText={setName} maxLength={100} style={ui.input} />
      <Pressable accessibilityRole="button" disabled={busy || !name.trim()} style={ui.button} onPress={() => { void provision(); }}>
        <Text style={ui.buttonText}>Đăng ký thiết bị mới</Text>
      </Pressable>
      {claim && <Text selectable style={ui.body}>UUID: {claim.deviceUuid}{'\n'}Mã kích hoạt: {claim.claimToken}{'\n'}Mã này dùng một lần; chưa thay cho khóa MQTT.</Text>}
    </View>}
  </View>;
}
