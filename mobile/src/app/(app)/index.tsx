import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { user, logout, error } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PHIÊN ĐÃ XÁC THỰC</Text>
      <Text style={styles.title}>Xin chào, {user?.fullName}</Text>
      <Text style={styles.subtitle}>API và xác thực đã sẵn sàng. Thiết bị và realtime được triển khai ở task tiếp theo.</Text>
      {!!error && <Text style={styles.warning}>{error} — đang hiển thị phiên đã lưu.</Text>}
      <Link href="/(app)/profile" style={styles.link}>Xem tài khoản</Link>
      <Pressable onPress={() => void logout()} style={styles.logout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 8, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 10, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  warning: { marginTop: 16, borderRadius: 10, backgroundColor: '#FFFBEB', color: '#92400E', padding: 12 },
  link: { marginTop: 28, color: colors.primary, fontWeight: '800' },
  logout: { marginTop: 28, alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 18, paddingVertical: 11 },
  logoutText: { color: colors.danger, fontWeight: '800' },
});
