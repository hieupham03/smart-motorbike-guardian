import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { devicesApi } from "@/api/devices.api";
import { normalizeApiError } from "@/api/errors";
import { SubmitButton } from "@/components/AuthForm";
import { confirmAction } from "@/components/confirmAction";
import {
  deviceConfigPayload,
  deviceFormSnapshot,
  mergeDeviceForm,
  thresholdFields,
} from "@/devices/deviceForm";
import { useGuardian } from "@/devices/GuardianContext";
import { canManageDevice } from "@/security/permissions";
import { colors } from "@/theme/colors";
import { roleLabel } from "@/devices/presentation";
import type { User } from "@/types/api";

export default function DeviceManagementScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const deviceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { devices, refresh } = useGuardian();
  const device = devices.find((item) => item.deviceId === deviceId);
  const allowed = canManageDevice(device?.currentUserRole ?? null);
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dirty = useRef(new Set<string>());
  const initialized = useRef<string | null>(null);

  useEffect(() => {
    if (!device) return;
    let active = true;
    const snapshot = deviceFormSnapshot(device);
    if (initialized.current !== device.deviceId) {
      dirty.current.clear();
      initialized.current = device.deviceId;
    }
    void Promise.resolve().then(() => {
      if (active)
        setForm((current) => mergeDeviceForm(current, snapshot, dirty.current));
    });
    return () => {
      active = false;
    };
  }, [device]);
  const loadUsers = useCallback(async () => {
    if (!deviceId || !allowed) return;
    try {
      setUsers((await devicesApi.users(deviceId)).data);
    } catch (cause) {
      setFeedback(normalizeApiError(cause).message);
    }
  }, [allowed, deviceId]);
  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  if (!deviceId || !device)
    return (
      <View style={styles.content}>
        <Text>Không tìm thấy thiết bị.</Text>
      </View>
    );
  if (!allowed)
    return (
      <View style={styles.content}>
        <Text style={styles.note}>
          Bạn được theo dõi xe nhưng chưa có quyền sửa thông tin hoặc chia sẻ
          quyền truy cập.
        </Text>
      </View>
    );

  const update = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const payload = deviceConfigPayload(device.dataSource, {
        name: form.name ?? "",
        licensePlate: form.licensePlate ?? "",
        vehicleModel: form.vehicleModel ?? "",
      });
      await devicesApi.updateConfig(deviceId, payload);
      dirty.current.clear();
      await refresh();
      setFeedback("Đã lưu thông tin xe.");
    } catch (cause) {
      setFeedback(normalizeApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };
  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      await devicesApi.inviteViewer(deviceId, email.trim());
      setEmail("");
      await loadUsers();
      setFeedback("Đã chia sẻ quyền theo dõi.");
    } catch (cause) {
      setFeedback(normalizeApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = (user: User) =>
    confirmAction(
      "Gỡ quyền theo dõi?",
      user.email,
      () => {
        void (async () => {
          try {
            await devicesApi.removeUser(deviceId, user.userId);
            await loadUsers();
          } catch (cause) {
            setFeedback(normalizeApiError(cause).message);
          }
        })();
      },
      true,
    );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.note}>
        Đặt tên xe và chia sẻ quyền theo dõi với người thân. Các thiết lập kỹ
        thuật nằm trong phần chẩn đoán.
      </Text>
      {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
      <View style={styles.card}>
        <Text style={styles.heading}>Thông tin xe</Text>
        {(
          [
            ["name", "Tên xe"],
            ["licensePlate", "Biển số"],
            ["vehicleModel", "Dòng xe"],
          ] as const
        ).map(([key, label]) => (
          <View style={styles.field} key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              accessibilityLabel={label}
              editable={
                device.dataSource === "SIMULATED" ||
                !thresholdFields.includes(key)
              }
              style={styles.input}
              value={form[key] ?? ""}
              keyboardType={
                key.includes("Threshold") ? "decimal-pad" : "default"
              }
              onChangeText={(value) => {
                dirty.current.add(key);
                setForm((old) => ({ ...old, [key]: value }));
              }}
            />
          </View>
        ))}
        <SubmitButton
          label="Lưu thông tin xe"
          loading={busy}
          onPress={() => void update()}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Người được chia sẻ</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email người được chia sẻ"
          placeholder="Email người thân"
        />
        <Pressable
          style={styles.add}
          disabled={busy}
          onPress={() => void invite()}
        >
          <Text style={styles.addText}>Chia sẻ theo dõi</Text>
        </Pressable>
        {users.map((item) => (
          <View key={item.userId} style={styles.user}>
            <View>
              <Text style={styles.userName}>{item.fullName}</Text>
              <Text style={styles.muted}>
                {item.email} · {roleLabel(item.role)}
              </Text>
            </View>
            {item.role === "VIEWER" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Gỡ quyền theo dõi của ${item.fullName}`}
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => remove(item)}
              >
                <Text style={styles.remove}>Gỡ</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14 },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
  },
  heading: { color: colors.text, fontSize: 18, fontWeight: "900" },
  warning: {
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    color: "#9A3412",
    padding: 12,
    lineHeight: 20,
  },
  note: { color: colors.textMuted },
  feedback: { color: colors.primary, fontWeight: "700" },
  field: { gap: 5 },
  label: { color: colors.text, fontWeight: "700" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
    color: colors.text,
  },
  add: {
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
    padding: 12,
  },
  addText: { color: "#FFF", fontWeight: "800" },
  user: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 10,
  },
  userName: { color: colors.text, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 12 },
  remove: { color: colors.danger, fontWeight: "800" },
});
