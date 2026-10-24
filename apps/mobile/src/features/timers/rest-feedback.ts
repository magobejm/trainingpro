import { Platform, Vibration } from 'react-native';

export function pulseRestEnd(): void {
  if (Platform.OS === 'web') return;
  Vibration.vibrate([0, 400, 200, 400]);
}
