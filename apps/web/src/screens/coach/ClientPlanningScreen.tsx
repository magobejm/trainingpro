import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { LoadingState } from '../../components/AsyncStatus';
import { useAppliedRoutineQuery } from '../../data/hooks/useRoutineAssignments';
import {
  buildWeekSlots,
  dayExerciseNames,
  readPublishedRoutine,
  type PublishedDay,
  type PublishedNeat,
  type PublishedRoutine,
  type WeekSlot,
} from './client-planning-view';

type Translate = (key: string, params?: Record<string, number | string>) => string;

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Read-only view of the published routine: week split, days and daily activity. */
export function ClientPlanningScreen(props: { clientId: string; t: Translate }): React.JSX.Element {
  const query = useAppliedRoutineQuery(props.clientId);
  if (query.isLoading) return <LoadingState label={props.t('coach.planning.loading')} />;
  const routine = readPublishedRoutine(query.data ?? null);
  if (!routine) return <Text style={styles.empty}>{props.t('coach.clientProfile.details.planning.empty')}</Text>;
  return <PlanningBody routine={routine} t={props.t} />;
}

function PlanningBody(props: { routine: PublishedRoutine; t: Translate }): React.JSX.Element {
  const days = [...props.routine.days].sort((left, right) => left.dayIndex - right.dayIndex);
  const slots = buildWeekSlots(days, props.routine.expectedCompletionDays);
  return (
    <View style={styles.page}>
      <Text style={styles.title}>{props.routine.name}</Text>
      {days.length > 0 ? <WeekSplit slots={slots} t={props.t} /> : null}
      {days.map((day) => (
        <DayCard day={day} key={day.dayIndex} t={props.t} />
      ))}
      <NeatList neats={props.routine.neats} t={props.t} />
    </View>
  );
}

function WeekSplit(props: { slots: WeekSlot[]; t: Translate }): React.JSX.Element {
  const rows = [props.slots.slice(0, 7), props.slots.slice(7)].filter((row) => row.length > 0);
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{props.t('coach.planning.week')}</Text>
      {rows.map((row) => (
        <View key={row[0]?.weekdayIndex} style={styles.grid}>
          {row.map((slot) => (
            <WeekCell key={slot.weekdayIndex} slot={slot} t={props.t} />
          ))}
        </View>
      ))}
    </View>
  );
}

function WeekCell(props: { slot: WeekSlot; t: Translate }): React.JSX.Element {
  const active = Boolean(props.slot.day);
  const title = props.slot.day?.title?.trim() || props.t('coach.planning.rest');
  return (
    <View style={[styles.cell, active ? styles.cellActive : styles.cellRest]}>
      <Text style={[styles.cellLabel, active ? styles.cellLabelActive : null]}>{slotLabel(props.slot, props.t)}</Text>
      <Text numberOfLines={2} style={[styles.cellTitle, active ? styles.cellTitleActive : styles.cellTitleRest]}>
        {title}
      </Text>
    </View>
  );
}

function DayCard(props: { day: PublishedDay; t: Translate }): React.JSX.Element {
  const names = dayExerciseNames(props.day);
  const title = props.day.title?.trim() || props.t('coach.planning.day', { index: props.day.dayIndex });
  return (
    <View style={styles.card}>
      <View style={styles.dayHead}>
        <View style={styles.dayIndex}>
          <Text style={styles.dayIndexText}>{String(props.day.dayIndex)}</Text>
        </View>
        <View style={styles.dayHeadText}>
          <Text style={styles.dayTitle}>{title}</Text>
          <Text style={styles.meta}>{props.t('coach.planning.exercises', { count: names.length })}</Text>
        </View>
      </View>
      {names.length > 0 ? (
        <View style={styles.exerciseList}>
          {names.map((name, index) => (
            <View key={`${props.day.dayIndex}-${index}`} style={styles.exerciseRow}>
              <View style={styles.exerciseMark} />
              <Text style={styles.exercise}>{name}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function NeatList(props: { neats: PublishedNeat[]; t: Translate }): React.JSX.Element | null {
  if (props.neats.length === 0) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.heading}>{props.t('coach.planning.neat')}</Text>
      {props.neats.map((neat, index) => (
        <View key={neat.id ?? String(index)} style={styles.neatCard}>
          <Text style={styles.dayTitle}>{neat.title}</Text>
          {neat.description?.trim() ? <Text style={styles.meta}>{neat.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function slotLabel(slot: WeekSlot, t: Translate): string {
  const key = WEEKDAY_KEYS[slot.weekdayIndex];
  return key ? t(`coach.planning.weekday.${key}`) : String(slot.weekdayIndex + 1);
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  cell: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: space.xs,
    justifyContent: 'center',
    minHeight: 76,
    minWidth: 0,
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
  },
  cellActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  cellLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  cellLabelActive: { color: colors.primary },
  cellRest: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  cellTitle: { fontSize: fontSize.xs, textAlign: 'center' },
  cellTitleActive: { color: colors.text, fontWeight: '600' },
  cellTitleRest: { color: colors.textMuted },
  dayHead: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  dayHeadText: { flex: 1, gap: 2, minWidth: 0 },
  dayIndex: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dayIndexText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  dayTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  exercise: { color: colors.text, flex: 1, fontSize: fontSize.sm },
  exerciseList: { borderTopColor: colors.border, borderTopWidth: 1, gap: space.sm, paddingTop: space.sm },
  exerciseMark: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 6,
    marginTop: 6,
    width: 6,
  },
  exerciseRow: { alignItems: 'flex-start', flexDirection: 'row', gap: space.sm },
  grid: { flexDirection: 'row', gap: space.sm },
  heading: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: fontSize.sm },
  neatCard: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.xs,
    padding: space.md,
  },
  page: { gap: space.lg, padding: space.md },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
});
