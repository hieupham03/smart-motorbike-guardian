import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

export function LiveMap({ latitude, longitude, stale }: { latitude: number; longitude: number; stale: boolean }) {
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor={stale ? '#D97706' : '#0F766E'}
          title={stale ? 'Vị trí hợp lệ gần nhất' : 'Vị trí GPS hiện tại'}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { height: 380, overflow: 'hidden', borderRadius: 16 } });
