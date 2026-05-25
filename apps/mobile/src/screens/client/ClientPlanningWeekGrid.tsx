import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { computeDayTypeStats, TYPE_BADGE, type WeekSlot } from './client-planning.helpers';

type Props = {
  slots: WeekSlot[];
  onSelectDay: (day: ClientRoutineDay) => void;
};

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function WeekDistributionGrid({ slots, onSelectDay }: Props): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('client.planning.weekDistribution')}</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAY_KEYS.map((d) => (
          <Text key={d} style={styles.weekdayLabel}>
            {t(`client.calendar.weekday.${d}`)}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {slots.slice(0, 7).map((slot) => (
          <SlotCell key={slot.weekdayIndex} onSelectDay={onSelectDay} slot={slot} />
        ))}
      </View>
    </View>
  );
}

type SlotCellProps = {
  slot: WeekSlot;
  onSelectDay: (day: ClientRoutineDay) => void;
};

function SlotCell({ slot, onSelectDay }: SlotCellProps): React.JSX.Element {
  const { t } = useTranslation();
  if (!slot.day) {
    return (
      <View style={[styles.cell, styles.cellRest]}>
        <Text style={styles.restLabel}>{t('client.planning.rest')}</Text>
      </View>
    );
  }
  const stats = computeDayTypeStats(slot.day);
  const badge = stats.dominantType ? TYPE_BADGE[stats.dominantType] : null;
  const bg = badge?.bg ?? 'rgba(168,85,247,0.2)';
  const textColor = badge?.text ?? '#c4b5fd';
  return (
    <Pressable onPress={() => onSelectDay(slot.day!)} style={[styles.cell, { backgroundColor: bg }]}>
      <Text style={[styles.cellDayNum, { color: textColor }]}>{`D${slot.day.dayIndex}`}</Text>
      <Text numberOfLines={1} style={[styles.cellName, { color: textColor }]}>
        {slot.day.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: '13.7%',
  },
  cellDayNum: { fontSize: 13, fontWeight: '800' },
  cellName: { fontSize: 8, fontWeight: '700', marginTop: 2, textAlign: 'center', textTransform: 'uppercase' },
  cellRest: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(168,85,247,0.15)', borderWidth: 1 },
  container: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
  },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  restLabel: {
    color: 'rgba(196,181,253,0.5)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  weekdayLabel: { color: 'rgba(196,181,253,0.5)', fontSize: 10, fontWeight: '700', textAlign: 'center', width: '13.7%' },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});
