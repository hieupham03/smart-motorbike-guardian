import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useGuardian } from "@/devices/GuardianContext";
import { commandFeedback, reasonLabel } from "@/devices/presentation";
import { SpeedLimitSettings } from "./SpeedLimitSettings";
import { normalizeApiError } from "@/api/errors";
import { canControlDevice } from "@/security/permissions";
import { colors } from "@/theme/colors";
import { ui } from "@/theme/userInterface";
import { confirmAction } from "./confirmAction";
const number = (value: number, digits = 0) =>
  value.toLocaleString("vi-VN", { maximumFractionDigits: digits });
export function WheelSessionPanel({
  developer = false,
}: {
  developer?: boolean;
}) {
  const {
    selectedDevice: device,
    wheelSession: session,
    commands,
    commandPending,
    sendCommand,
  } = useGuardian();
  const [id, setId] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  if (device?.dataSource !== "HARDWARE") return null;
  const allowed = canControlDevice(device.currentUserRole),
    pending = commandPending || commands.some((c) => c.status === "PENDING");
  const command = commands.find((c) => c.cmdId === id),
    canReset = allowed && !!session?.fresh && !pending;
  const reset = async () => {
    setError(null);
    try {
      setId((await sendCommand({ type: "RESET_WHEEL_SESSION" })).cmdId);
    } catch (cause) {
      setError(reasonLabel(normalizeApiError(cause).message));
    }
  };
  const cells = session
    ? [
        ["Quãng đường quy đổi", `${number(session.distanceM, 2)} m`],
        ["Tốc độ cao nhất", `${number(session.maxSpeedKmh, 1)} km/h`],
        ["Thời gian phiên", `${number(session.elapsedMs / 1000)} giây`],
        ...(developer
          ? [
              ["Số xung Hall", number(session.pulseCount)],
              ["Số vòng", number(session.revolutions, 2)],
              ["Thời gian có xung", `${number(session.movingMs / 1000)} s`],
            ]
          : []),
      ]
    : [];
  return (
    <View style={ui.card} accessibilityLabel="Thống kê phiên">
      <Text style={ui.heading}>Thống kê phiên</Text>
      <Text style={ui.body}>
        Quãng đường ước tính theo vòng bánh, không phải hành trình trên bản đồ.
      </Text>
      {!session ? (
        <Text style={ui.body}>Đang chờ thông tin từ xe.</Text>
      ) : (
        <>
          <Text
            style={
              !session.fresh
                ? ui.warning
                : session.overspeedActive
                  ? ui.error
                  : ui.info
            }
          >
            {!session.fresh
              ? "Chưa có cập nhật mới. Đang giữ thống kê lần cuối."
              : session.overspeedActive
                ? "Xe đang vượt ngưỡng tốc độ cảnh báo."
                : "Thống kê đang được cập nhật."}
          </Text>
          <View style={styles.grid}>
            {cells.map(([label, value]) => (
              <View style={styles.cell} key={label}>
                <Text style={ui.caption}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
          <Text style={ui.caption}>
            Cảnh báo tốc độ: {number(session.speedLimitKmh, 1)} km/h. Chức năng
            này không tự giảm tốc hoặc khóa xe.
          </Text>
        </>
      )}
      <SpeedLimitSettings key={device.deviceId} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bắt đầu phiên mới"
        disabled={!canReset}
        style={[ui.button, ui.secondary, !canReset && ui.disabled]}
        onPress={() =>
          confirmAction(
            "Bắt đầu phiên mới?",
            "Thống kê của phiên hiện tại sẽ bắt đầu lại từ 0.",
            () => void reset(),
          )
        }
      >
        <Text style={[ui.buttonText, ui.secondaryText]}>Bắt đầu phiên mới</Text>
      </Pressable>
      {!allowed && (
        <Text style={ui.caption}>
          Chỉ chủ xe hoặc người có quyền điều khiển mới được bắt đầu lại phiên.
        </Text>
      )}
      {command && (
        <Text accessibilityLiveRegion="polite" style={ui.info}>
          {commandFeedback(command)}
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Text style={ui.caption}>
        Phiên bắt đầu lại khi thiết bị khởi động lại hoặc khi bạn chọn bắt đầu
        phiên mới.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  cell: { flexBasis: 130, flexGrow: 1, gap: 4 },
  value: { color: colors.text, fontSize: 22, fontWeight: "700" },
});
