import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensurePermission } from '../../data/push-registration';

const REST_NOTIFICATION_ID = 'rest-timer';
const REST_CHANNEL_ID = 'rest-timer';

type RestNotice = {
  body: string;
  title: string;
};

const CANCEL_SLACK_MS = 2_000;

export function useRestEndNotification(rest: { endAt: number } | null | undefined, texts: RestNotice): void {
  const endAt = rest === undefined ? undefined : (rest?.endAt ?? null);
  const scheduledEndAt = useRef<number | null>(null);
  const { body, title } = texts;
  useEffect(() => {
    if (endAt === undefined) return;
    if (endAt == null) {
      const dueAt = scheduledEndAt.current;
      scheduledEndAt.current = null;
      if (dueAt == null || dueAt - Date.now() > CANCEL_SLACK_MS) void cancelRestEnd();
      return;
    }
    scheduledEndAt.current = endAt;
    void scheduleRestEnd(endAt, { body, title });
  }, [body, endAt, title]);
}

export async function scheduleRestEnd(endAt: number, texts: RestNotice): Promise<void> {
  if (Platform.OS === 'web' || endAt <= Date.now()) return;
  await ensureRestChannel();
  const granted = await ensurePermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      body: texts.body,
      data: { kind: 'rest-timer' },
      sound: 'default',
      title: texts.title,
      vibrate: [0, 400, 200, 400],
    },
    identifier: REST_NOTIFICATION_ID,
    trigger: {
      channelId: REST_CHANNEL_ID,
      date: new Date(endAt),
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });
}

export async function cancelRestEnd(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID).catch(() => undefined);
}

async function ensureRestChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REST_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    name: REST_CHANNEL_ID,
    sound: 'default',
    vibrationPattern: [0, 400, 200, 400],
  });
}
