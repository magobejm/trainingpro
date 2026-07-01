import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { computeDayTypeStats, TYPE_BADGE } from './client-planning.helpers';
import { LIGHT } from '../../theme/light';

type Props = {
  day: ClientRoutineDay;
  onPress: () => void;
};

export function PlanDayCard({ day, onPress }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const stats = computeDayTypeStats(day);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{`D${day.dayIndex}`}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{day.title}</Text>
        <Text style={styles.subtitle}>{t('client.planning.exercisesCount', { count: stats.total })}</Text>
        <View style={styles.typeRow}>
          {stats.byType.map((tc) => (
            <View key={tc.type} style={[styles.typePill, { backgroundColor: TYPE_BADGE[tc.type].bg }]}>
              <Text style={[styles.typePillText, { color: TYPE_BADGE[tc.type].text }]}>
                {`${TYPE_BADGE[tc.type].label} ${String(tc.count)}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  badgeText: { color: LIGHT.accentDark, fontSize: 13, fontWeight: '800' },
  card: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },
  chevron: { color: LIGHT.accentMuted, fontSize: 18 },
  info: { flex: 1 },
  subtitle: { color: LIGHT.textMuted, fontSize: 11, marginTop: 2 },
  title: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '700' },
  typePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typePillText: { fontSize: 9, fontWeight: '700' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
});
