import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';
import type { RoutineEditorWeek } from '@trainerpro/shared';
import { isWeekPeriod } from '../routine-period';

type Translate = (key: string, options?: Record<string, unknown>) => string;

function Chip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={props.active}
      onPress={props.onPress}
      style={[styles.chip, props.active ? styles.chipOn : null]}
    >
      <Text style={[styles.chipText, props.active ? styles.chipTextOn : null]}>{props.label}</Text>
    </Pressable>
  );
}

/** Weeks and days to touch. Weeks that are already completed are not offered. */
export function ProgressionSelector(props: {
  cycleDays: number;
  dayChoices: Array<{ dayIndex: number; label: string }>;
  days: number[];
  onToggleAll: () => void;
  onToggleDay: (dayIndex: number) => void;
  onToggleWeek: (weekId: string) => void;
  selected: string[];
  t: Translate;
  weeks: RoutineEditorWeek[];
}): React.JSX.Element {
  const { t } = props;
  const weekPeriod = isWeekPeriod(props.cycleDays);
  const allOn = props.weeks.length > 0 && props.weeks.every((week) => props.selected.includes(week.id));
  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t(weekPeriod ? 'coach.clientRoutine.command.weeks' : 'coach.clientRoutine.command.cycles')}
        </Text>
        <Button
          label={t(allOn ? 'coach.clientRoutine.command.clearAll' : 'coach.clientRoutine.command.selectAll')}
          onPress={props.onToggleAll}
          size="sm"
          variant="secondary"
        />
      </View>
      <View style={styles.chips}>
        {props.weeks.map((week) => (
          <Chip
            active={props.selected.includes(week.id)}
            key={week.id}
            label={t(weekPeriod ? 'coach.clientRoutine.week' : 'coach.clientRoutine.cycle', { n: week.weekIndex })}
            onPress={() => props.onToggleWeek(week.id)}
          />
        ))}
      </View>
      {weekPeriod ? null : <Text style={styles.hint}>{t('coach.clientRoutine.cycleSize', { count: props.cycleDays })}</Text>}
      <Text style={styles.title}>{t('coach.clientRoutine.command.days')}</Text>
      <Text style={styles.hint}>{t('coach.clientRoutine.command.daysHint')}</Text>
      <View style={styles.chips}>
        {props.dayChoices.map((day) => (
          <Chip
            active={props.days.includes(day.dayIndex)}
            key={day.dayIndex}
            label={day.label}
            onPress={() => props.onToggleDay(day.dayIndex)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  chip: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.sm },
  chipTextOn: { color: colors.onPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
});
