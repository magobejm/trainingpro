import { Alert, Platform, ToastAndroid } from 'react-native';

export function showComingSoon(label: string): void {
  const message = `${label} — próximamente`;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Próximamente', message);
  }
}

export function showToast(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert('', message);
}

export function showError(message: string, title = 'Error'): void {
  Alert.alert(title, message);
}
