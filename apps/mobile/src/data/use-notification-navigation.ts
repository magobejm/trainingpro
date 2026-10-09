import React from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useNotificationTargetStore } from '../store/notification-target.store';
import { resolveNotificationTarget } from './notification-routing';

const COLD_START_MAX_AGE_MS = 60_000;

let handledId: string | null = null;

export function useNotificationNavigation(): void {
  const role = useAuthStore((state) => state.activeRole);
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.userId);
  const notice = useNotificationTargetStore((state) => state.notice);
  const clearNotice = useNotificationTargetStore((state) => state.clearNotice);
  const setTarget = useNotificationTargetStore((state) => state.setTarget);

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }
    return listenForNotificationTaps();
  }, []);

  React.useEffect(() => {
    if (Platform.OS === 'web' || status !== 'signedIn' || !userId) {
      return undefined;
    }
    let cancelled = false;
    void import('expo-notifications').then((Notifications) => {
      if (cancelled) {
        return;
      }
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          rememberNotice(response, true);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  React.useEffect(() => {
    if (!notice || status !== 'signedIn' || !userId || (role !== 'coach' && role !== 'client')) {
      return;
    }
    const target = resolveNotificationTarget(notice.data, { role, userId });
    handledId = notice.id;
    clearNotice();
    if (target) {
      setTarget(target);
    }
  }, [clearNotice, notice, role, setTarget, status, userId]);
}

function listenForNotificationTaps(): () => void {
  let remove = (): void => undefined;
  let cancelled = false;
  void import('expo-notifications').then((Notifications) => {
    if (cancelled) {
      return;
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      rememberNotice(response, false);
    });
    remove = () => subscription.remove();
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        rememberNotice(response, true);
      }
    });
  });
  return () => {
    cancelled = true;
    remove();
  };
}

function rememberNotice(
  response: {
    notification: { date: number; request: { content: { data: unknown }; identifier: string } };
  },
  coldStart: boolean,
): void {
  const id = response.notification.request.identifier;
  const current = useNotificationTargetStore.getState().notice;
  if (handledId === id || current?.id === id) {
    return;
  }
  if (coldStart && noticeAgeMs(response.notification.date) > COLD_START_MAX_AGE_MS) {
    handledId = id;
    return;
  }
  useNotificationTargetStore.getState().setNotice({
    data: readData(response.notification.request.content.data),
    id,
  });
}

function noticeAgeMs(date: number): number {
  if (!date) {
    return 0;
  }
  const millis = date < 1_000_000_000_000 ? date * 1000 : date;
  return Date.now() - millis;
}

function readData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as Record<string, unknown>;
}
