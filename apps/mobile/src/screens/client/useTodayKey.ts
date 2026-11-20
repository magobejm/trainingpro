import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localDateKey } from './daily-checkin.utils';

const DAY_TICK_MS = 30_000;

/** Local calendar day (YYYY-MM-DD) that refreshes when the day changes or the app returns to the foreground. */
export function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState(() => localDateKey());
  useEffect(() => {
    const refreshToday = () => setTodayKey(localDateKey());
    const interval = setInterval(refreshToday, DAY_TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshToday();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
  return todayKey;
}
