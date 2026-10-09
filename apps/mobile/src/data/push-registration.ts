import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createApiClient, type ActiveRole } from './api-client';

type PushAuth = {
  accessToken: string;
  activeRole: Extract<ActiveRole, 'client' | 'coach'>;
};

let rememberedToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(auth: PushAuth): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return;
  }
  await ensureAndroidChannel();
  if (!(await ensurePermission())) {
    return;
  }
  const projectId = readProjectId();
  if (!projectId) {
    return;
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  rememberedToken = token.data;
  await createApiClient(auth).post('/notifications/device-token', {
    platform: Platform.OS,
    token: token.data,
  });
}

export async function unregisterPushToken(auth: PushAuth): Promise<void> {
  const token = rememberedToken ?? (await readExistingToken());
  rememberedToken = null;
  if (!token) {
    return;
  }
  await createApiClient(auth).delete('/notifications/device-token', { token });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: 'default',
  });
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

async function readExistingToken(): Promise<string | null> {
  const projectId = readProjectId();
  if (!projectId || Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

function readProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const projectId = extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return projectId && projectId.length > 0 ? projectId : null;
}
