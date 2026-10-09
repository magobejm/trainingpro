import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createApiClient, UnauthorizedApiError, type ActiveRole } from './api-client';

type PushAuth = {
  accessToken: string;
  activeRole: Extract<ActiveRole, 'client' | 'coach'>;
};

const PENDING_KEY = 'trainerpro.push.pending';
const UNREGISTER_TIMEOUT_MS = 2000;

let rememberedToken: string | null = null;
let currentAuth: PushAuth | null = null;
let listening = false;

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
  currentAuth = auth;
  ensureTokenListener();
  if (Platform.OS === 'web' || !Device.isDevice) {
    return;
  }
  await ensureAndroidChannel();
  const granted = await ensurePermission();
  const token = await readTokenForRegistration();
  if (!token) {
    return;
  }
  rememberedToken = token;
  await createApiClient(auth).post('/notifications/device-token', {
    enabled: granted,
    platform: Platform.OS,
    token,
  });
  await clearPendingToken();
}

export async function unregisterPushToken(auth: PushAuth): Promise<void> {
  const token = rememberedToken ?? (await readExistingToken()) ?? (await readPendingToken());
  rememberedToken = null;
  currentAuth = null;
  if (!token) {
    return;
  }
  const removed = await withTimeout(deactivateToken(auth, token), UNREGISTER_TIMEOUT_MS);
  if (removed) {
    await clearPendingToken();
    return;
  }
  await savePendingToken(token);
}

async function deactivateToken(auth: PushAuth, token: string): Promise<boolean> {
  try {
    await createApiClient(auth).delete('/notifications/device-token', { token });
    return true;
  } catch (error) {
    if (error instanceof UnauthorizedApiError) {
      return false;
    }
    return false;
  }
}

function ensureTokenListener(): void {
  if (listening) {
    return;
  }
  listening = true;
  Notifications.addPushTokenListener((event) => {
    const auth = currentAuth;
    if (!auth) {
      return;
    }
    rememberedToken = event.data;
    void registerChangedToken(auth, event.data);
  });
}

async function registerChangedToken(auth: PushAuth, token: string): Promise<void> {
  const current = await Notifications.getPermissionsAsync();
  const body = { enabled: current.granted, platform: Platform.OS, token };
  await createApiClient(auth)
    .post('/notifications/device-token', body)
    .catch(() => undefined);
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
  if (current.canAskAgain === false) {
    return false;
  }
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

async function readTokenForRegistration(): Promise<string | null> {
  try {
    return await readExistingToken();
  } catch {
    return readPendingToken();
  }
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

async function readPendingToken(): Promise<string | null> {
  try {
    const store = await import('expo-secure-store');
    return store.getItemAsync(PENDING_KEY);
  } catch {
    return null;
  }
}

async function savePendingToken(token: string): Promise<void> {
  try {
    const store = await import('expo-secure-store');
    await store.setItemAsync(PENDING_KEY, token);
  } catch {
    return;
  }
}

async function clearPendingToken(): Promise<void> {
  try {
    const store = await import('expo-secure-store');
    await store.deleteItemAsync(PENDING_KEY);
  } catch {
    return;
  }
}

function withTimeout(task: Promise<boolean>, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    void task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(false);
      },
    );
  });
}
