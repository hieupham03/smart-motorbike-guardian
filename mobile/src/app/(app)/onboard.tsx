import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { devicesApi } from '@/api/devices.api';
import { normalizeApiError } from '@/api/errors';
import { SubmitButton } from '@/components/AuthForm';
import { useGuardian } from '@/devices/GuardianContext';
import { extractClaimToken } from '@/onboarding/claimToken';
import { colors } from '@/theme/colors';

export default function OnboardScreen() {
  const router = useRouter();
  const { refresh } = useGuardian();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [claimToken, setClaimToken] = useState('');
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = ({ data }: BarcodeScanningResult) => {
    const token = extractClaimToken(data);
    setScanning(false);
    if (!token) setError('QR không chứa claimToken hợp lệ.');
    else { setClaimToken(token); setError(null); }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) { setError('Cần quyền camera để quét QR. Bạn vẫn có thể nhập token thủ công.'); return; }
    }
    setScanning(true);
  };

  const submit = async () => {
    const token = extractClaimToken(claimToken);
    if (!token || !name.trim()) { setError('Claim token và tên xe là bắt buộc.'); return; }
    setBusy(true); setError(null);
    try {
      await devicesApi.onboard({ claimToken: token, name: name.trim(), licensePlate: licensePlate.trim(), vehicleModel: vehicleModel.trim() });
      await refresh();
      router.back();
    } catch (cause) { setError(normalizeApiError(cause).message); }
    finally { setBusy(false); }
  };

  if (scanning) return (
    <View style={styles.cameraPage}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scan} />
      <View style={styles.scanFooter}>
        <Text style={styles.scanText}>Đưa QR claim token vào khung hình</Text>
        <Pressable style={styles.cancel} onPress={() => setScanning(false)}><Text style={styles.cancelText}>Hủy quét</Text></Pressable>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.note}>QR hỗ trợ token thuần, JSON có trường claimToken hoặc liên kết có query claimToken.</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.secondary} onPress={() => void openScanner()}><Text style={styles.secondaryText}>Quét QR</Text></Pressable>
      <Field label="Claim token" value={claimToken} onChangeText={setClaimToken} secureTextEntry />
      <Field label="Tên xe" value={name} onChangeText={setName} />
      <Field label="Biển số (không bắt buộc)" value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" />
      <Field label="Dòng xe (không bắt buộc)" value={vehicleModel} onChangeText={setVehicleModel} />
      <SubmitButton label="Kích hoạt thiết bị" loading={busy} onPress={() => void submit()} />
    </ScrollView>
  );
}

function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} {...props} /></View>;
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14 }, note: { color: colors.textMuted, lineHeight: 20 },
  error: { borderRadius: 10, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 12 },
  secondary: { alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.primary, padding: 13 }, secondaryText: { color: colors.primary, fontWeight: '800' },
  field: { gap: 6 }, label: { color: colors.text, fontWeight: '700' }, input: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, padding: 12 },
  cameraPage: { flex: 1, backgroundColor: '#000' }, scanFooter: { position: 'absolute', right: 20, bottom: 40, left: 20, alignItems: 'center', gap: 16 }, scanText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, cancel: { borderRadius: 10, backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12 }, cancelText: { color: colors.text, fontWeight: '800' },
});
