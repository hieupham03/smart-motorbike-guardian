import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DeviceSelector } from "@/components/DeviceSelector";
import { useGuardian } from "@/devices/GuardianContext";
import { useRefresh } from "@/devices/useRefresh";
import { getGpsPresentation } from "@/map/gps";
// eslint-disable-next-line import/no-unresolved
import { LiveMap } from "@/map/LiveMap";
import { ui } from "@/theme/userInterface";
export default function MapScreen() {
  const { selectedDevice: device } = useGuardian(),
    gps = getGpsPresentation(device);
  const { refreshing, onRefresh } = useRefresh();
  const title =
    gps.state === "FIX"
      ? "Vị trí mới cập nhật"
      : gps.state === "STALE"
        ? "Vị trí cuối đã biết"
        : "Chưa xác định được vị trí";
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
      <Text style={ui.title}>Vị trí xe</Text>
      <DeviceSelector />
      <View style={ui.card}>
        <Text style={ui.heading}>{title}</Text>
        <Text style={ui.body}>
          {gps.state === "FIX"
            ? "Đang hiển thị vị trí mới nhận từ thiết bị trên xe."
            : gps.state === "STALE"
              ? "Đây là vị trí lần cuối đã nhận, không phải vị trí hiện tại."
              : "Đang chờ vị trí từ thiết bị. Tín hiệu định vị có thể yếu khi xe ở trong nhà."}
        </Text>
        {device?.lastLocationReceivedAt && (
          <Text style={ui.caption}>
            Cập nhật vị trí:{" "}
            {new Date(device.lastLocationReceivedAt).toLocaleString("vi-VN")}
          </Text>
        )}
      </View>
      {gps.coordinate ? (
        <LiveMap
          latitude={gps.coordinate.latitude}
          longitude={gps.coordinate.longitude}
          stale={gps.state === "STALE"}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={ui.body}>
            Vị trí sẽ xuất hiện khi thiết bị định vị được xe.
          </Text>
        </View>
      )}
      <Text style={ui.caption}>
        Vị trí lấy từ thiết bị trên xe, không phải vị trí của điện thoại bạn.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  placeholder: {
    minHeight: 260,
    justifyContent: "center",
    padding: 28,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
});
