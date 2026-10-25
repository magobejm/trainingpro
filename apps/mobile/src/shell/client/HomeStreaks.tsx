import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useClientCalendarSummaryQuery } from '../../data/hooks/useClientCalendar';
import { LIGHT } from '../../theme/light';

export function HomeStreaks(): React.JSX.Element | null {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const summary = useClientCalendarSummaryQuery(today, today);
  if (!summary.data) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
      <Text style={chip}>{t('mobile.client.home.trainingStreak', { count: summary.data.currentStreakWeeks })}</Text>
      <Text style={chip}>{t('mobile.client.home.nutritionStreak', { count: summary.data.nutritionStreakWeeks })}</Text>
    </View>
  );
}

const chip = {
  backgroundColor: LIGHT.bgCard,
  borderRadius: LIGHT.radiusFull,
  color: LIGHT.textStrong,
  fontSize: 13,
  fontWeight: '700' as const,
  overflow: 'hidden' as const,
  paddingHorizontal: 12,
  paddingVertical: 8,
};
