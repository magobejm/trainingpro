import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useClientThreadQuery, useSendChatMessageMutation } from '../../data/hooks/useChat';
import { useAuthStore } from '../../store/auth.store';
import { useDailyCheckinStore } from '../../store/daily-checkin.store';
import { showToast } from '../../shell/client/feedback';
import {
  formatMorningCheckinChatNotice,
  localDateKey,
  readTodayCheckin,
  type MorningCheckinScores,
} from './daily-checkin.utils';
import { MorningCheckinModal } from './MorningCheckinModal';

const DAY_TICK_MS = 30_000;

export function MorningCheckinGate(): React.JSX.Element {
  const { t } = useTranslation();
  const [hydrated, setHydrated] = useState(useDailyCheckinStore.persist.hasHydrated());
  const [todayKey, setTodayKey] = useState(localDateKey);
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.userId);
  const entries = useDailyCheckinStore((state) => state.entries);
  const saveToday = useDailyCheckinStore((state) => state.saveToday);
  const dismissToday = useDailyCheckinStore((state) => state.dismissToday);
  const notifyCoach = useOptionalCoachNotice();
  const todayEntry = readTodayCheckin(entries, userId, todayKey);
  const visible = hydrated && status === 'signedIn' && userId !== null && todayEntry === null;

  useEffect(() => {
    return useDailyCheckinStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const refreshToday = () => setTodayKey(localDateKey());
    const interval = setInterval(refreshToday, DAY_TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToday();
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const handleSubmit = useCallback(
    (scores: MorningCheckinScores) => {
      if (!userId) {
        return;
      }
      saveToday(userId, todayKey, scores);
      showToast(t('mobile.client.checkin.saved'));
      void notifyCoach(formatMorningCheckinChatNotice(scores));
    },
    [notifyCoach, saveToday, t, todayKey, userId],
  );

  const handleSkip = useCallback(() => {
    if (!userId) {
      return;
    }
    dismissToday(userId, todayKey);
  }, [dismissToday, todayKey, userId]);

  return <MorningCheckinModal isSubmitting={false} onSkip={handleSkip} onSubmit={handleSubmit} visible={visible} />;
}

export function useOptionalCoachNotice(): (text: string) => Promise<void> {
  const threadQuery = useClientThreadQuery();
  const sendMutation = useSendChatMessageMutation(threadQuery.data?.id ?? '');
  return useCallback(
    async (text: string) => {
      if (!threadQuery.data?.id) {
        return;
      }
      try {
        await sendMutation.mutateAsync({ text });
      } catch {
        // Chat notice is optional; local/session persistence still counts.
      }
    },
    [sendMutation, threadQuery.data?.id],
  );
}
