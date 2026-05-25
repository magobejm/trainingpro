import { Alert, Platform, ToastAndroid } from 'react-native';

export function showComingSoon(label: string): void {
  const message = `${label} — próximamente`;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Próximamente', message);
  }
}
