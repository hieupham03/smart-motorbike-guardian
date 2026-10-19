import { StyleSheet, Text, View } from 'react-native';

export function LiveMap({ latitude, longitude, stale }: { latitude: number; longitude: number; stale: boolean }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bản đồ native</Text>
      <Text style={styles.text}>{stale ? 'Vị trí cũ' : 'GPS FIX'}: {latitude.toFixed(6)}, {longitude.toFixed(6)}</Text>
      <Text style={styles.text}>Mở Android/iOS development build để xem bản đồ.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 240, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#E2E8F0', padding: 20 },
  title: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  text: { marginTop: 7, color: '#475569', textAlign: 'center' },
});
