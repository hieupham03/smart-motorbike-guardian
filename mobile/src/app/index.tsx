import { StyleSheet, Text, View } from 'react-native';

export default function BootstrapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>GUARDIAN</Text>
      </View>
      <Text style={styles.title}>Smart Motorbike Guardian</Text>
      <Text style={styles.subtitle}>Ứng dụng đang được khởi tạo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  badge: {
    marginBottom: 20,
    borderRadius: 999,
    backgroundColor: '#14B8A6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#042F2E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 16,
  },
});
