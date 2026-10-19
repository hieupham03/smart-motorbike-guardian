import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { GuardianProvider } from '@/devices/GuardianContext';
import { NotificationBridge } from '@/push/NotificationBridge';
import { colors } from '@/theme/colors';

export default function AppLayout() {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;
  return (
    <GuardianProvider>
      <NotificationBridge />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceDark },
          headerTintColor: '#F8FAFC',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Tài khoản' }} />
        <Stack.Screen name="onboard" options={{ title: 'Thêm thiết bị' }} />
        <Stack.Screen name="device/[id]" options={{ title: 'Quản lý thiết bị' }} />
        <Stack.Screen name="history" options={{ title: 'Lịch sử & xuất dữ liệu' }} />
        <Stack.Screen name="admin" options={{ title: 'Quản trị hệ thống' }} />
      </Stack>
    </GuardianProvider>
  );
}
