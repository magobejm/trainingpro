import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { weekdayName } from '@trainerpro/shared';
import '../../i18n';
import type { DayData, DayWorkout, PlanDayView } from './client-calendar.helpers';
import { WorkoutSkipActions } from './client-calendar-skip';
import { formatLocalDate } from './routine-schedule.utils';
import { LIGHT } from '../../theme/light';

type Props = {
  data: DayData | undefined;
  dateStr: string;
  exerciseCountFor: (planDayId: string | null) => number | null;
  onOpenPlanDay: (planDayId: string, view: PlanDayView) => void;
  onOpenSession?: (sessionId: string) => void;
};

export function CalendarWorkoutList(props: Props): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const workouts = props.data?.workouts ?? [];
  if (workouts.length === 0) {
    return (
      <View style={styles.block}>
        <Text style={styles.title}>{t('client.calendar.detail.rest')}</Text>
        <Text style={styles.hint}>{t('client.calendar.detail.restHint')}</Text>
      </View>
    );
  }
  return (
    <View style={styles.block}>
      {workouts.map((workout, index) => (
        <WorkoutRow
          count={props.exerciseCountFor(workout.planDayId)}
          dateStr={props.dateStr}
          key={`${workout.planDayId ?? 'workout'}-${String(index)}`}
          language={i18n.language}
          onOpenPlanDay={props.onOpenPlanDay}
          onOpenSession={props.onOpenSession}
          t={t}
          todayStr={formatLocalDate(new Date())}
          workout={workout}
        />
      ))}
    </View>
  );
}

function WorkoutRow(props: {
  count: number | null;
  dateStr: string;
  language: string;
  onOpenPlanDay: (planDayId: string, view: PlanDayView) => void;
  onOpenSession?: (sessionId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  todayStr: string;
  workout: DayWorkout;
}): React.JSX.Element {
  const title = props.workout.title || props.t('client.calendar.chip.workout');
  return (
    <View style={styles.row}>
      <Pressable
        disabled={!props.workout.planDayId}
        onPress={() => {
          if (props.workout.planDayId) {
            props.onOpenPlanDay(props.workout.planDayId, {
              outcome: props.workout.outcome,
              performed: props.workout.done,
              sessionId: props.workout.sessionId,
              skipReason: props.workout.skipReason,
            });
          }
        }}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>
          {props.workout.planDayId
            ? props.t('client.calendar.detail.openWorkout')
            : props.t('client.calendar.detail.sessionSummary')}
        </Text>
        {props.count != null ? (
          <Text style={styles.meta}>{props.t('client.calendar.detail.exerciseCount', { count: props.count, title })}</Text>
        ) : null}
        <WorkoutStatus language={props.language} t={props.t} workout={props.workout} />
      </Pressable>
      <WorkoutSkipActions
        dateStr={props.dateStr}
        onOpenSession={props.onOpenSession}
        t={props.t}
        todayStr={props.todayStr}
        workout={props.workout}
      />
      {props.workout.done && props.workout.sessionId && props.onOpenSession ? (
        <Pressable onPress={() => props.onOpenSession?.(props.workout.sessionId!)} style={styles.sessionButton}>
          <Text style={styles.sessionButtonText}>{props.t('client.calendar.detail.viewSession')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function statusLabel(outcome: DayWorkout['outcome'], t: Translate): string | null {
  if (outcome === 'done') return t('client.calendar.workout.done');
  if (outcome === 'incomplete') return t('client.calendar.workout.incomplete');
  if (outcome === 'skipped') return t('client.calendar.workout.skipped');
  return null;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function WorkoutStatus(props: {
  language: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  workout: DayWorkout;
}): React.JSX.Element | null {
  const label = statusLabel(props.workout.outcome, props.t);
  if (!label && !props.workout.skipReason) return null;
  return (
    <View>
      {label ? <Text style={styles.meta}>{label}</Text> : null}
      {props.workout.outcome === 'skipped' && props.workout.skipReason ? (
        <Text style={styles.meta}>{props.workout.skipReason}</Text>
      ) : null}
      {props.workout.shift && props.workout.originDate ? (
        <Text style={styles.meta}>
          {props.t(`client.calendar.workout.${props.workout.shift}`, {
            day: weekdayName(props.workout.originDate, props.language),
          })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
  hint: { color: LIGHT.accentDark, fontSize: 13 },
  meta: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '600' },
  row: { gap: 6 },
  sessionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  sessionButtonText: { color: LIGHT.accentDark, fontSize: 15, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 22, fontWeight: '800' },
});
