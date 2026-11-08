import { useRouter } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { DeviceSelector } from "@/components/DeviceSelector";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GuardianIcon } from "@/components/GuardianIcon";
import { WheelSessionPanel } from "@/components/WheelSessionPanel";
import { useGuardian } from "@/devices/GuardianContext";
import { useRefresh } from "@/devices/useRefresh";
import {
  securityLabel,
  lifecycleLabel,
  sourceLabel,
} from "@/devices/presentation";
import { colors } from "@/theme/colors";
import { ui } from "@/theme/userInterface";

export default function DashboardScreen() {
  const router = useRouter();
  const { selectedDevice: device, loading, error, alerts } = useGuardian();
  const { refreshing, onRefresh } = useRefresh();
  if (loading) return <LoadingScreen label="Đang tải thông tin xe…" />;
  const count = alerts.filter(
    (a) => a.deviceId === device?.deviceId && a.status === "OPEN",
  ).length;
  const speed =
    device?.speedValid && Number.isFinite(device.lastSpeedKmh)
      ? device.lastSpeedKmh
      : null;
  return (
    <ScrollView
      contentContainerStyle={ui.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
        />
      }
    >
      <View>
        <Text style={styles.eyebrow}>XE CỦA BẠN</Text>
        <Text style={ui.title}>An tâm hơn mỗi ngày</Text>
        <Text style={ui.body}>Những cập nhật gần nhất từ xe của bạn.</Text>
      </View>
      <DeviceSelector />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.warning}>
          Chưa cập nhật được một số thông tin. Kiểm tra mạng rồi kéo xuống để
          thử lại.
        </Text>
      )}
      {!device ? (
        <View style={ui.card}>
          <Text style={ui.heading}>Thêm xe đầu tiên</Text>
          <Text style={ui.body}>
            Kết nối thiết bị trên xe hoặc nhờ chủ xe chia sẻ quyền theo dõi.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={ui.button}
            onPress={() => router.push("/(app)/(tabs)/devices")}
          >
            <Text style={ui.buttonText}>Xe của tôi</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {device.dataSource !== "HARDWARE" && (
            <Text style={ui.warning}>
              {sourceLabel(device.dataSource)} · Không dùng số liệu này để xác
              nhận tình trạng xe ngoài thực tế.
            </Text>
          )}
          <View style={ui.card}>
            <View style={ui.row}>
              <View style={styles.avatar}>
                <GuardianIcon name="bike" color={colors.primary} size={32} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={ui.heading}>{device.name}</Text>
                <Text style={ui.body}>
                  {device.licensePlate || "Chưa thêm biển số"}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.security,
                device.securityState === "ALARM" && styles.alarm,
              ]}
            >
              {securityLabel(device.securityState)}
            </Text>
            <Text style={ui.body}>
              {device.securityState === "PARKED"
                ? "Bật bảo vệ sau khi đỗ xe để nhận cảnh báo tác động."
                : device.securityState === "ARMED"
                  ? "Xe đang được canh giữ. Kiểm tra cảnh báo khi có tác động."
                  : "Kiểm tra tình trạng xe và các cảnh báo liên quan."}
            </Text>
          </View>
          <View style={styles.speedCard}>
            <Text style={ui.label}>Tốc độ gần nhất</Text>
            <Text style={styles.speed}>
              {speed == null ? "—" : speed!.toFixed(1)}{" "}
              <Text style={styles.unit}>km/h</Text>
            </Text>
            <Text style={ui.body}>
              {device.speedValid
                ? "Cập nhật từ cảm biến trên xe."
                : "Chưa có dữ liệu tốc độ mới."}
            </Text>
          </View>
          <View style={ui.card}>
            <Text style={ui.heading}>
              {lifecycleLabel(device.lifecycleState)}
            </Text>
            <Text style={ui.body}>
              {device.sensorConnected
                ? "Đang nhận thông tin mới từ xe."
                : "Thông tin cảm biến chưa được cập nhật."}
            </Text>
            <Text style={ui.caption}>
              Cập nhật từ xe:{" "}
              {device.lastTelemetryAt
                ? new Date(device.lastTelemetryAt).toLocaleString("vi-VN")
                : "Chưa nhận được dữ liệu"}
            </Text>
          </View>
          <View style={styles.links}>
            <Pressable
              accessibilityRole="button"
              style={[ui.button, styles.link]}
              onPress={() => router.push("/(app)/(tabs)/control")}
            >
              <GuardianIcon name="shield" color="#FFF" />
              <Text style={ui.buttonText}>Bảo vệ xe</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary, styles.link]}
              onPress={() => router.push("/(app)/(tabs)/map")}
            >
              <GuardianIcon name="map" color={colors.primary} />
              <Text style={[ui.buttonText, ui.secondaryText]}>Vị trí xe</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            style={ui.card}
            onPress={() => router.push("/(app)/(tabs)/alerts")}
          >
            <Text style={ui.heading}>{count} cảnh báo chưa xem</Text>
            <Text style={ui.body}>
              Xem thông báo cần kiểm tra từ xe của bạn.
            </Text>
          </Pressable>
          <WheelSessionPanel key={device.deviceId} />
          <Text style={ui.caption}>
            Thiết bị thử nghiệm trên mô hình. Luôn kiểm tra tình trạng xe thực
            tế khi có cảnh báo.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: 6,
  },
  avatar: {
    height: 60,
    width: 60,
    backgroundColor: "#E0F2FE",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: { flex: 1, minWidth: 140 },
  security: { color: colors.primary, fontWeight: "800", fontSize: 17 },
  alarm: { color: colors.danger },
  speedCard: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    gap: 8,
  },
  speed: { color: colors.text, fontSize: 44, fontWeight: "800" },
  unit: { fontSize: 16, fontWeight: "500", color: colors.textMuted },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  link: { flexGrow: 1, flexBasis: 140, gap: 8 },
});
