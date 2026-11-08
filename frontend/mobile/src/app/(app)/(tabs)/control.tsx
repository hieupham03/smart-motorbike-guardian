import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { confirmAction } from "@/components/confirmAction";
import { DeviceSelector } from "@/components/DeviceSelector";
import { useGuardian } from "@/devices/GuardianContext";
import {
  commandLabel,
  commandFeedback,
  commandStatusLabel,
  reasonLabel,
  securityLabel,
} from "@/devices/presentation";
import { normalizeApiError } from "@/api/errors";
import { canControlDevice } from "@/security/permissions";
import { colors } from "@/theme/colors";
import { ui } from "@/theme/userInterface";
import type { CommandType } from "@/types/api";

const actions: CommandType[] = [
  "ARM",
  "DISARM",
  "LOCK_ENGINE",
  "UNLOCK_ENGINE",
  "SIREN_ON",
  "SIREN_OFF",
];
export default function ControlScreen() {
  const { selectedDevice } = useGuardian();
  return (
    <DeviceControl
      key={`${selectedDevice?.deviceId ?? "none"}:${selectedDevice?.currentUserRole ?? "none"}`}
    />
  );
}
function DeviceControl() {
  const {
    selectedDevice: device,
    commands,
    sendCommand,
    commandPending,
  } = useGuardian();
  const [id, setId] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [lockOpen, setLockOpen] = useState(false),
    [password, setPassword] = useState("");
  const allowed = canControlDevice(device?.currentUserRole),
    ready = device?.lifecycleState === "ACTIVE";
  const pending =
    commandPending || commands.some((c) => c.status === "PENDING");
  const active = commands.find((c) => c.cmdId === id);
  async function execute(type: CommandType, confirmationPassword?: string) {
    if (!allowed || !ready || pending) return;
    setError(null);
    try {
      setId((await sendCommand({ type, confirmationPassword })).cmdId);
    } catch (cause) {
      setError(reasonLabel(normalizeApiError(cause).message));
    }
  }
  function request(type: CommandType) {
    if (type === "LOCK_ENGINE") {
      setLockOpen(true);
      return;
    }
    confirmAction(
      commandLabel(type),
      `${commandLabel(type)} cho ${device?.name}?`,
      () => void execute(type),
      type === "SIREN_ON",
    );
  }
  return (
    <>
      <FlatList
        contentContainerStyle={ui.content}
        data={commands.slice(0, 20)}
        keyExtractor={(item) => item.cmdId}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={ui.title}>Bảo vệ & điều khiển</Text>
            <DeviceSelector />
            <Text style={ui.body}>
              {device
                ? `${device.name} · ${securityLabel(device.securityState)}`
                : "Chọn xe trước khi gửi yêu cầu."}
            </Text>
            <Text style={ui.body}>
              Bật bảo vệ sau khi bánh xe đã dừng. Thiết bị sẽ kiểm tra điều kiện
              trước khi thực hiện.
            </Text>
            {!allowed && (
              <Text style={ui.info}>
                Bạn được theo dõi xe. Hãy liên hệ chủ xe nếu cần quyền điều
                khiển.
              </Text>
            )}
            {allowed && !ready && (
              <Text style={ui.warning}>
                Thiết bị chưa kết nối. Điều khiển sẽ sẵn sàng khi kết nối được
                khôi phục.
              </Text>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={ui.error}>
                {error}
              </Text>
            )}
            {active && (
              <Text
                accessibilityLiveRegion="polite"
                style={active.status === "EXECUTED" ? ui.info : ui.warning}
              >
                {commandFeedback(active)}
              </Text>
            )}
            <View style={styles.grid}>
              {actions.map((type) => (
                <Pressable
                  accessibilityRole="button"
                  key={type}
                  disabled={!allowed || !ready || pending}
                  onPress={() => request(type)}
                  style={({ pressed }) => [
                    styles.action,
                    type === "LOCK_ENGINE" && styles.danger,
                    (!allowed || !ready || pending) && ui.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      type === "LOCK_ENGINE" && styles.dangerText,
                    ]}
                  >
                    {commandLabel(type)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={ui.caption}>
              Cảnh báo tốc độ không tự giảm tốc hoặc khóa xe. Yêu cầu chỉ được
              xác nhận sau khi thiết bị phản hồi.
            </Text>
            <Text style={ui.heading}>Yêu cầu gần đây</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={ui.body}>Chưa có yêu cầu điều khiển.</Text>
        }
        renderItem={({ item }) => (
          <View style={ui.card}>
            <Text style={ui.heading}>{commandLabel(item.type)}</Text>
            <Text style={styles.result}>{commandStatusLabel(item.status)}</Text>
            <Text style={ui.caption}>
              {new Date(item.issuedAt).toLocaleString("vi-VN")}
            </Text>
            {!!item.reasonIfFailed && (
              <Text style={ui.warning}>{reasonLabel(item.reasonIfFailed)}</Text>
            )}
            {!!item.lateAckAt && (
              <Text style={ui.caption}>
                Phản hồi muộn từ xe: {commandStatusLabel(item.lateAckResult)}
                {item.lateAckReason ? ` · ${reasonLabel(item.lateAckReason)}` : ""}.
                Hãy kiểm tra trạng thái hiện tại của xe.
              </Text>
            )}
          </View>
        )}
        ListFooterComponent={
          <Text style={ui.caption}>
            Chưa nhận được phản hồi? Kiểm tra kết nối và tình trạng xe trước khi
            gửi lại yêu cầu.
          </Text>
        }
      />
      <Modal
        transparent
        visible={lockOpen}
        animationType="none"
        onRequestClose={() => setLockOpen(false)}
      >
        <View style={styles.scrim}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={ui.heading}>
              Xác nhận khóa động cơ
            </Text>
            <Text style={ui.body}>
              Chỉ khóa khi xe đã dừng. Nhập mật khẩu để xác nhận; thiết bị sẽ
              kiểm tra lại dữ liệu trước khi xử lý.
            </Text>
            <Text style={ui.label}>Mật khẩu</Text>
            <TextInput
              accessibilityLabel="Mật khẩu xác nhận khóa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Mật khẩu"
              autoComplete="current-password"
              style={ui.input}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!password || pending || !allowed || !ready}
              style={[
                ui.button,
                styles.dangerButton,
                (!password || pending || !allowed || !ready) && ui.disabled,
              ]}
              onPress={() => {
                const value = password;
                setPassword("");
                setLockOpen(false);
                void execute("LOCK_ENGINE", value);
              }}
            >
              <Text style={ui.buttonText}>Gửi yêu cầu khóa</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[ui.button, ui.secondary]}
              onPress={() => {
                setLockOpen(false);
                setPassword("");
              }}
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>Hủy</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  header: { gap: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: {
    flexBasis: 140,
    flexGrow: 1,
    minHeight: 78,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  actionText: {
    color: "#075985",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
  danger: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  dangerText: { color: "#991B1B" },
  pressed: { opacity: 0.75 },
  result: { color: colors.primary, fontWeight: "700" },
  scrim: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,.7)",
    padding: 22,
  },
  dialog: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 16,
    maxHeight: "95%",
  },
  dangerButton: { backgroundColor: "#B91C1C" },
});
