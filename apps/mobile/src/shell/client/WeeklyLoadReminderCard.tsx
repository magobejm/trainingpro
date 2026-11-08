import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { nextWeekStart, shouldShowLoadReminder } from '@trainerpro/shared';
import { useClientWellnessQuery } from '../../data/hooks/useClientWellness';
import { buildDefaultWellnessRange } from '../../screens/client/client-mood.helpers';
import { localDateKey } from '../../screens/client/daily-checkin.utils';
import { useAuthStore } from '../../store/auth.store';
import { readState, useWeeklyLoadReminderStore } from '../../store/weekly-load-reminder.store';
import { LIGHT } from '../../theme/light';

type Props = { onWrite: () => void };

/** Recordatorio de viernes a domingo para contar la carga de la semana siguiente. */
export function WeeklyLoadReminderCard({ onWrite }: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.userId);
  const states = useWeeklyLoadReminderStore((state) => state.states);
  const postpone = useWeeklyLoadReminderStore((state) => state.postpone);
  const dismiss = useWeeklyLoadReminderStore((state) => state.dismiss);
  const todayKey = localDateKey();
  const range = useMemo(() => buildDefaultWellnessRange(), []);
  const wellness = useClientWellnessQuery(range.dateFrom, range.dateTo);
  const nextWeek = nextWeekStart(todayKey);
  const hasNote = (wellness.data?.weeklyLoads ?? []).some((load) => load.weekStartDate === nextWeek);
  if (!userId || !shouldShowLoadReminder(todayKey, readState(states, userId), hasNote)) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('mobile.client.loadReminder.title')}</Text>
      <Text style={styles.body}>{t('mobile.client.loadReminder.body')}</Text>
      <View style={styles.actions}>
        <Pressable onPress={onWrite} style={[styles.btn, styles.primary]}>
          <Text style={styles.primaryText}>{t('mobile.client.loadReminder.write')}</Text>
        </Pressable>
        <Pressable onPress={() => postpone(userId, todayKey)} style={styles.btn}>
          <Text style={styles.btnText}>{t('mobile.client.loadReminder.postpone')}</Text>
        </Pressable>
        <Pressable onPress={() => dismiss(userId)} style={styles.btn}>
          <Text style={styles.btnText}>{t('mobile.client.loadReminder.dismiss')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  body: { color: LIGHT.text, fontSize: 13 },
  btn: {
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: { color: LIGHT.text, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.accentMuted,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  primary: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  primaryText: { color: LIGHT.textOnNavy, fontSize: 12, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '800' },
});
