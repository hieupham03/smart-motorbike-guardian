import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/auth/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GuardianProvider } from "@/devices/GuardianContext";
import { NotificationBridge } from "@/push/NotificationBridge";
import { colors } from "@/theme/colors";

export default function AppLayout() {
  const { status, user } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status !== "authenticated") return <Redirect href="/(auth)/login" />;
  return (
    <GuardianProvider key={user?.userId}>
      <NotificationBridge />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Tài khoản" }} />
        <Stack.Screen name="onboard" options={{ title: "Thêm xe" }} />
        <Stack.Screen
          name="device/[id]"
          options={{ title: "Thông tin xe & chia sẻ" }}
        />
        <Stack.Screen name="history" options={{ title: "Lịch sử hoạt động" }} />
        <Stack.Screen name="admin" options={{ title: "Quản trị hệ thống" }} />
        <Stack.Screen
          name="developer"
          options={{ title: "Chẩn đoán & thử nghiệm" }}
        />
      </Stack>
    </GuardianProvider>
  );
}
