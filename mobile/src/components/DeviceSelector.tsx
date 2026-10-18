import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useGuardian } from '@/devices/GuardianContext';
import { colors } from '@/theme/colors';

export function DeviceSelector() {
  const { devices, selectedDeviceId, selectDevice } = useGuardian();
  if (devices.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {devices.map((device) => {
        const active = device.deviceId === selectedDeviceId;
        return (
          <Pressable key={device.deviceId} onPress={() => selectDevice(device.deviceId)} style={[styles.item, active && styles.active]}>
            <Text style={[styles.name, active && styles.activeText]}>{device.name}</Text>
            <Text style={[styles.plate, active && styles.activeSubtext]}>{device.licensePlate || 'Chưa có biển số'}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  item: { minWidth: 150, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 12 },
  active: { borderColor: colors.primary, backgroundColor: '#CCFBF1' },
  name: { color: colors.text, fontWeight: '800' },
  activeText: { color: '#115E59' },
  plate: { marginTop: 3, color: colors.textMuted, fontSize: 12 },
  activeSubtext: { color: '#0F766E' },
});
