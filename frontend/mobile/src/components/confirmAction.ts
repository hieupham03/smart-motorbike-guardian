import { Alert, Platform } from 'react-native';

export function confirmAction(title: string, message: string, accept: () => void, destructive = false) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) accept();
    return;
  }
  Alert.alert(title, message, [{ text: 'Hủy', style: 'cancel' },
    { text: 'Xác nhận', style: destructive ? 'destructive' : 'default', onPress: accept }]);
}
