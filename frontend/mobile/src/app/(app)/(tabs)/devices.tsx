import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useGuardian } from "@/devices/GuardianContext";
import { useRefresh } from "@/devices/useRefresh";
import {
  securityLabel,
  lifecycleLabel,
  roleLabel,
  sourceLabel,
  canUseDeveloperTools,
} from "@/devices/presentation";
import { ui } from "@/theme/userInterface";

export default function DevicesScreen() {
  const router = useRouter(),
    { user } = useAuth();
  const { devices, selectedDevice, selectedDeviceId, selectDevice, loading } =
    useGuardian();
  const { refreshing, onRefresh } = useRefresh();
  if (loading) return <LoadingScreen label="Đang tải danh sách xe…" />;
  return (
    <FlatList
      contentContainerStyle={ui.content}
      data={devices}
      keyExtractor={(item) => item.deviceId}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <Text style={ui.title}>Xe của tôi</Text>
          <Text style={ui.body}>
            Chọn xe để theo dõi hoặc chia sẻ với người thân.
          </Text>
          <View style={ui.row}>
            {user?.role !== "VIEWER" && (
              <Pressable
                accessibilityRole="button"
                style={ui.button}
                onPress={() => router.push("/(app)/onboard")}
              >
                <Text style={ui.buttonText}>Thêm xe</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary]}
              onPress={() => router.push("/(app)/history")}
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>Lịch sử</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary]}
              onPress={() => router.push("/(app)/profile")}
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>Tài khoản</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={ui.body}>
          Bạn chưa có xe để theo dõi. Thêm thiết bị hoặc nhờ chủ xe chia sẻ
          quyền.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={ui.card}>
          <Text style={ui.heading}>{item.name}</Text>
          <Text style={ui.body}>
            {item.licensePlate || "Chưa có biển số"} ·{" "}
            {item.vehicleModel || "Chưa có dòng xe"}
          </Text>
          <Text style={ui.label}>{securityLabel(item.securityState)}</Text>
          <Text style={ui.body}>
            {lifecycleLabel(item.lifecycleState)} ·{" "}
            {roleLabel(item.currentUserRole)}
          </Text>
          {item.dataSource !== "HARDWARE" && (
            <Text style={ui.warning}>{sourceLabel(item.dataSource)}</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              selected: item.deviceId === selectedDeviceId,
            }}
            style={[ui.button, ui.secondary]}
            onPress={() => {
              selectDevice(item.deviceId);
              router.push("/(app)/(tabs)");
            }}
          >
            <Text style={[ui.buttonText, ui.secondaryText]}>
              {item.deviceId === selectedDeviceId
                ? "Đang theo dõi xe này"
                : "Xem tình trạng xe"}
            </Text>
          </Pressable>
          {(item.currentUserRole === "OWNER" ||
            item.currentUserRole === "ADMIN") && (
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary]}
              onPress={() =>
                router.push({
                  pathname: "/(app)/device/[id]",
                  params: { id: item.deviceId },
                })
              }
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>
                Thông tin xe & chia sẻ
              </Text>
            </Pressable>
          )}
        </View>
      )}
      ListFooterComponent={
        <View style={{ gap: 12, paddingTop: 12 }}>
          {user?.role === "ADMIN" && (
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary]}
              onPress={() => router.push("/(app)/admin")}
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>
                Quản trị hệ thống
              </Text>
            </Pressable>
          )}
          {canUseDeveloperTools(
            user?.role,
            selectedDevice?.currentUserRole,
          ) && (
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary]}
              onPress={() => router.push("/(app)/developer")}
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>
                Chẩn đoán & thử nghiệm
              </Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}
