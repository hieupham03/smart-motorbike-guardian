import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { useGuardian } from "@/devices/GuardianContext";
import { canUseDeveloperTools, reasonLabel } from "@/devices/presentation";
import { devicesApi } from "@/api/devices.api";
import { normalizeApiError } from "@/api/errors";
import { DeviceSelector } from "@/components/DeviceSelector";
import { WheelSessionPanel } from "@/components/WheelSessionPanel";
import { confirmAction } from "@/components/confirmAction";
import { ui } from "@/theme/userInterface";
import {
  deviceConfigPayload,
  deviceFormSnapshot,
  mergeDeviceForm,
  thresholdFields,
} from "@/devices/deviceForm";

export default function DeveloperScreen() {
  const { user } = useAuth();
  const {
    selectedDevice: device,
    telemetry,
    commands,
    alerts,
    wheelSession,
    realtimeStatus,
    refresh,
    sendCommand,
    commandPending,
  } = useGuardian();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const dirty = useRef(new Set<string>()),
    formDevice = useRef<string | null>(null);
  useEffect(() => {
    if (!device) return;
    if (formDevice.current !== device.deviceId) {
      dirty.current.clear();
      formDevice.current = device.deviceId;
    }
    const snapshot = deviceFormSnapshot(device);
    void Promise.resolve().then(() =>
      setForm((current) => mergeDeviceForm(current, snapshot, dirty.current)),
    );
  }, [device]);
  const allowed = canUseDeveloperTools(user?.role, device?.currentUserRole);
  const canOperate =
    device?.currentUserRole === "OWNER" || device?.currentUserRole === "ADMIN";
  const waiting =
    busy || commandPending || commands.some((c) => c.status === "PENDING");
  if (!allowed)
    return (
      <View style={ui.content}>
        <Text style={ui.title}>Khu vực chẩn đoán</Text>
        <Text style={ui.body}>
          Cần quyền chủ xe hoặc quản trị viên để mở công cụ thử nghiệm cho xe đã
          chọn.
        </Text>
      </View>
    );
  const simulate = async (
    action: "SET_SPEED" | "TRIGGER_FALL" | "TRIGGER_THEFT_TAMPER",
    value: number | null,
  ) => {
    if (!device || device.dataSource !== "SIMULATED" || !canOperate || waiting)
      return;
    setBusy(true);
    setMessage(null);
    try {
      await devicesApi.simulate(device.deviceId, action, value);
      await refresh();
      setMessage(`Simulator: ${action} · ${value ?? "event"} sent`);
    } catch (cause) {
      setMessage(normalizeApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };
  const reboot = async () => {
    if (!device || !canOperate || waiting || device.lifecycleState !== "ACTIVE")
      return;
    setBusy(true);
    try {
      const result = await sendCommand({ type: "REBOOT" });
      setMessage(`REBOOT: ${result.status} · cmd_id=${result.cmdId}`);
    } catch (cause) {
      setMessage(reasonLabel(normalizeApiError(cause).message));
    } finally {
      setBusy(false);
    }
  };
  const saveSimulation = async () => {
    if (!device || device.dataSource !== "SIMULATED" || !canOperate || waiting)
      return;
    setBusy(true);
    setMessage(null);
    try {
      await devicesApi.updateConfig(
        device.deviceId,
        deviceConfigPayload("SIMULATED", form),
      );
      dirty.current.clear();
      await refresh();
      setMessage("Đã lưu ngưỡng cho simulator. Không áp dụng cho phần cứng.");
    } catch (cause) {
      setMessage(normalizeApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <Text style={ui.title}>Chẩn đoán & thử nghiệm</Text>
      <Text style={ui.warning}>
        Dành cho dev. Lệnh điều khiển có thể tác động đến thiết bị thật. Giả lập
        chỉ dùng cho xe có nguồn SIMULATED.
      </Text>
      <DeviceSelector />
      <View style={ui.card}>
        <Text style={ui.heading}>Kết nối & dữ liệu thiết bị</Text>
        {Object.entries({
          WebSocket: realtimeStatus,
          deviceId: device?.deviceId,
          deviceUuid: device?.deviceUuid,
          source: device?.dataSource,
          firmware: device?.firmwareVersion,
          state: device?.securityState,
          lifecycle: device?.lifecycleState,
          sensorConnected: device?.sensorConnected,
          speedValid: device?.speedValid,
          imuValid: device?.imuValid,
          gpsValid: device?.gpsValid,
          gpsAgeMs: device?.gpsAgeMs,
          lastTelemetryAt: device?.lastTelemetryAt,
        }).map(([key, value]) => (
          <View key={key}>
            <Text style={ui.caption}>{key}</Text>
            <Text selectable style={ui.body}>
              {value == null ? "null" : String(value)}
            </Text>
          </View>
        ))}
      </View>
      <View style={ui.card}>
        <Text style={ui.heading}>Cảm biến</Text>
        <Text selectable style={ui.body}>
          Accel: {telemetry?.accelX ?? "null"}, {telemetry?.accelY ?? "null"},{" "}
          {telemetry?.accelZ ?? "null"} m/s²
        </Text>
        <Text style={ui.body}>
          Điện áp:{" "}
          {telemetry?.batteryV == null
            ? "Chưa đo / chưa có ADC"
            : `${telemetry.batteryV} V`}
        </Text>
        <Text style={ui.body}>
          UART: 115200 baud · telemetry 39 B · wheel sample 13 B · checksum XOR
        </Text>
        <Text style={ui.body}>
          Đổi ngưỡng tốc độ của thiết bị thật tại mục Thống kê phiên. Các ngưỡng
          mô phỏng ở đây không cập nhật xuống thiết bị.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        style={ui.button}
        disabled={waiting}
        onPress={() => {
          void refresh();
        }}
      >
        <Text style={ui.buttonText}>Lấy lại dữ liệu</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={[
          ui.button,
          ui.secondary,
          (!canOperate || waiting || device?.lifecycleState !== "ACTIVE") &&
            ui.disabled,
        ]}
        disabled={!canOperate || waiting || device?.lifecycleState !== "ACTIVE"}
        onPress={() =>
          confirmAction(
            "Khởi động lại thiết bị?",
            "Thiết bị sẽ kiểm tra điều kiện và trả kết quả trước khi khởi động lại.",
            () => void reboot(),
            true,
          )
        }
      >
        <Text style={[ui.buttonText, ui.secondaryText]}>
          Khởi động lại thiết bị
        </Text>
      </Pressable>
      {device?.dataSource === "SIMULATED" && canOperate && (
        <View style={ui.card}>
          <Text style={ui.heading}>Simulator · dữ liệu giả lập</Text>
          <Text style={ui.body}>
            Các thao tác này gọi API mô phỏng hiện có, không điều khiển phần
            cứng.
          </Text>
          {(
            [
              { label: "SET_SPEED 0", action: "SET_SPEED", value: 0 },
              { label: "SET_SPEED 30", action: "SET_SPEED", value: 30 },
              { label: "TRIGGER_FALL", action: "TRIGGER_FALL", value: null },
              {
                label: "TRIGGER_THEFT_TAMPER",
                action: "TRIGGER_THEFT_TAMPER",
                value: null,
              },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              disabled={waiting}
              style={[ui.button, ui.secondary, waiting && ui.disabled]}
              onPress={() =>
                confirmAction(
                  "Gửi sự kiện mô phỏng?",
                  item.label,
                  () => void simulate(item.action, item.value),
                )
              }
            >
              <Text style={[ui.buttonText, ui.secondaryText]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={ui.info}>
          {message}
        </Text>
      )}
      {device?.dataSource === "SIMULATED" && canOperate && (
        <View style={ui.card}>
          <Text style={ui.heading}>Ngưỡng mô phỏng</Text>
          {thresholdFields.map((key) => (
            <View key={key}>
              <Text style={ui.label}>{key}</Text>
              <TextInput
                accessibilityLabel={key}
                keyboardType="decimal-pad"
                style={ui.input}
                value={form[key] ?? ""}
                onChangeText={(value) => {
                  dirty.current.add(key);
                  setForm((current) => ({ ...current, [key]: value }));
                }}
              />
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={waiting}
            style={[ui.button, waiting && ui.disabled]}
            onPress={() => void saveSimulation()}
          >
            <Text style={ui.buttonText}>Lưu ngưỡng mô phỏng</Text>
          </Pressable>
        </View>
      )}
      <WheelSessionPanel developer />
      <View style={ui.card}>
        <Text style={ui.heading}>Snapshot gốc · không chứa token</Text>
        <Text selectable style={[ui.caption, { fontFamily: "monospace" }]}>
          {JSON.stringify(
            {
              telemetry,
              wheelSession,
              commands: commands.slice(0, 15),
              alerts: alerts
                .filter((a) => a.deviceId === device?.deviceId)
                .slice(0, 10),
            },
            null,
            2,
          )}
        </Text>
      </View>
    </ScrollView>
  );
}
