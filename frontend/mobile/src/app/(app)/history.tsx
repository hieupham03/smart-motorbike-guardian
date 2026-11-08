import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { devicesApi } from "@/api/devices.api";
import { normalizeApiError } from "@/api/errors";
import { useGuardian } from "@/devices/GuardianContext";
// Expo resolves the native/web implementation at bundle time.
// eslint-disable-next-line import/no-unresolved
import { exportTelemetryCsv } from "@/history/csv";
import {
  HISTORY_LIMIT,
  rangeToEpochMs,
  sampleSeries,
  type HistoryRange,
} from "@/history/range";
import { colors } from "@/theme/colors";
import { commandLabel, commandStatusLabel } from "@/devices/presentation";
import type { Telemetry } from "@/types/api";

export default function HistoryScreen() {
  const { selectedDevice, commands } = useGuardian();
  const deviceId = selectedDevice?.deviceId;
  const [range, setRange] = useState<HistoryRange>("24h");
  const [readings, setReadings] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timestamps = useMemo(() => rangeToEpochMs(range), [range]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!deviceId) {
        if (active) setReadings([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await devicesApi.telemetryHistory(
          deviceId,
          timestamps.from,
          timestamps.to,
          0,
          HISTORY_LIMIT,
        );
        if (active) setReadings(response.data);
      } catch (cause) {
        if (active) setError(normalizeApiError(cause).message);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [deviceId, timestamps]);
  const speeds = useMemo(
    () => sampleSeries(readings.map((item) => item.speedKmh)),
    [readings],
  );
  const batteries = useMemo(
    () => sampleSeries(readings.map((item) => item.batteryV)),
    [readings],
  );
  const exportCsv = async () => {
    if (!selectedDevice) return;
    setExporting(true);
    setError(null);
    try {
      await exportTelemetryCsv(
        selectedDevice.deviceId,
        timestamps.from,
        timestamps.to,
      );
    } catch (cause) {
      setError(normalizeApiError(cause).message);
    } finally {
      setExporting(false);
    }
  };

  if (!selectedDevice)
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chọn thiết bị trước khi xem lịch sử.</Text>
      </View>
    );
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{selectedDevice.name}</Text>
      <View style={styles.ranges}>
        {(["1h", "24h", "7d"] as HistoryRange[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setRange(item)}
            style={[styles.range, range === item && styles.rangeActive]}
          >
            <Text
              style={range === item ? styles.rangeTextActive : styles.rangeText}
            >
              {item === "1h" ? "1 giờ" : item === "24h" ? "24 giờ" : "7 ngày"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.limit}>
        Hiển thị tối đa {HISTORY_LIMIT.toLocaleString("vi-VN")} bản ghi trong
        khoảng thời gian đã chọn.
      </Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Chart title="Tốc độ (km/h)" values={speeds} color={colors.info} />
          {batteries.length > 0 && (
            <Chart
              title="Điện áp pin (V)"
              values={batteries}
              color={colors.success}
            />
          )}
          <Pressable
            disabled={exporting}
            style={styles.export}
            onPress={() => void exportCsv()}
          >
            <Text style={styles.exportText}>
              {exporting ? "Đang xuất..." : "Tải bảng dữ liệu"}
            </Text>
          </Pressable>
        </>
      )}
      <View style={styles.card}>
        <Text style={styles.heading}>Điều khiển gần đây</Text>
        {commands.slice(0, 30).map((command) => (
          <View key={command.cmdId} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{commandLabel(command.type)}</Text>
              <Text style={styles.muted}>
                {new Date(command.issuedAt).toLocaleString("vi-VN")}
              </Text>
            </View>
            <Text style={styles.status}>
              {commandStatusLabel(command.status)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Dữ liệu gần đây</Text>
        {readings
          .slice(-20)
          .reverse()
          .map((item) => (
            <View key={item.readingId} style={styles.row}>
              <Text style={styles.muted}>
                {new Date(item.receivedAt).toLocaleString("vi-VN")}
              </Text>
              <Text style={styles.rowTitle}>
                {item.speedKmh ?? "—"} km/h
                {item.batteryV != null ? ` · ${item.batteryV} V` : ""}
              </Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

function Chart({
  title,
  values,
  color,
}: {
  title: string;
  values: number[];
  color: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.chart}>
        {values.length ? (
          values.map((value, index) => (
            <View
              key={`${index}-${value}`}
              accessibilityLabel={`${value}`}
              style={[
                styles.bar,
                {
                  backgroundColor: color,
                  height: 8 + ((value - min) / span) * 72,
                },
              ]}
            />
          ))
        ) : (
          <Text style={styles.muted}>Không có dữ liệu hợp lệ.</Text>
        )}
      </View>
      {values.length > 0 && (
        <Text style={styles.muted}>
          Thấp nhất {Math.min(...values).toFixed(1)} · Cao nhất{" "}
          {Math.max(...values).toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 22, fontWeight: "900" },
  muted: { color: colors.textMuted, fontSize: 12 },
  ranges: { flexDirection: "row", gap: 8 },
  range: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 11,
  },
  rangeActive: { backgroundColor: colors.primary },
  rangeText: { color: colors.text },
  rangeTextActive: { color: "#FFF", fontWeight: "800" },
  limit: { color: colors.textMuted, lineHeight: 19 },
  error: {
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
    padding: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  heading: { color: colors.text, fontSize: 17, fontWeight: "900" },
  chart: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: { flex: 1, minWidth: 2, borderRadius: 2 },
  export: {
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.primary,
    padding: 14,
  },
  exportText: { color: "#FFF", fontWeight: "900" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 9,
  },
  rowTitle: { color: colors.text, fontWeight: "700" },
  status: { color: colors.primary, fontWeight: "800", fontSize: 12 },
});
