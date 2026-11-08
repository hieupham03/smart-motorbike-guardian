import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function LiveMap({
  latitude,
  longitude,
  stale,
}: {
  latitude: number;
  longitude: number;
  stale: boolean;
}) {
  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180
  ) {
    return <Text style={styles.text}>Chưa có vị trí hợp lệ để hiển thị bản đồ.</Text>;
  }
  const lat = latitude.toFixed(6), lon = longitude.toFixed(6);
  const bounds = [
    Math.max(-180, longitude - 0.005), Math.max(-90, latitude - 0.005),
    Math.min(180, longitude + 0.005), Math.min(90, latitude + 0.005),
  ].map((value) => value.toFixed(6)).join(",");
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  return (
    <View style={styles.container}>
      <Text style={[styles.title, stale && styles.stale]}>
        {stale ? "Vị trí cuối đã biết" : "Vị trí xe trên bản đồ"}
      </Text>
      <iframe
        title={stale ? "Bản đồ vị trí cuối đã biết của xe" : "Bản đồ vị trí xe"}
        src={mapUrl}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{ width: "100%", height: 380, border: 0, borderRadius: 12, display: "block" }}
      />
      <Text style={styles.coordinate}>
        {stale ? "Vị trí cuối đã biết" : "Vị trí mới cập nhật"}:{" "}
        {lat}, {lon}
      </Text>
      <Text style={styles.text}>
        {stale ? "Đây là vị trí lần cuối đã nhận, không phải vị trí hiện tại. " : ""}
        Cần kết nối Internet để tải nền bản đồ.
      </Text>
      <a
        href={fullMapUrl}
        target="_blank"
        rel="noopener"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 12, padding: "0 16px", background: "#F0F9FF", color: "#075985", fontWeight: 700, textDecoration: "none" }}
      >
        Mở bản đồ lớn
      </a>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  stale: { color: colors.warning },
  coordinate: { color: colors.text, fontSize: 13, lineHeight: 20 },
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
