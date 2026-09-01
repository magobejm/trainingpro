import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useClientCalendarEventsQuery } from '../../data/hooks/useClientCalendar';
import { useClientRoutineQuery, type ClientRoutine, type ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { s } from '../../shell/client/client-shell.styles';
import { ConfirmModal } from '../../theme/ConfirmModal';
import { LIGHT } from '../../theme/light';
import {
  formatScheduledDateLabel,
  getWeekDateRange,
  resolveRoutineWeekSchedule,
  scheduledWorkoutToRoutineDay,
  type ScheduledWorkout,
} from './routine-schedule.utils';

type RoutineScreenProps = {
  onClose: () => void;
  onSelectDay: (day: ClientRoutineDay, isToday: boolean) => void;
};

export function RoutineScreen({ onClose, onSelectDay }: RoutineScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: routine, isLoading } = useClientRoutineQuery();
  const [pendingDay, setPendingDay] = useState<ClientRoutineDay | null>(null);
  const today = useMemo(() => new Date(), []);
  const weekRange = useMemo(() => getWeekDateRange(today), [today]);
  const calendarQuery = useClientCalendarEventsQuery(weekRange.from, weekRange.to);

  const schedule = useMemo(() => {
    if (!routine) return null;
    return resolveRoutineWeekSchedule(routine.planDays, calendarQuery.data?.data ?? [], today);
  }, [calendarQuery.data?.data, routine, today]);

  const handleSelectDay = (day: ClientRoutineDay, isToday: boolean) => {
    if (isToday) {
      onSelectDay(day, true);
      return;
    }
    setPendingDay(day);
  };

  const handleConfirmOtherDay = () => {
    if (!pendingDay) return;
    onSelectDay(pendingDay, false);
    setPendingDay(null);
  };

  if (isLoading || calendarQuery.isLoading) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={onClose} title={t('mobile.client.routine.title')} />
        <View style={s.centered}>
          <ActivityIndicator color={LIGHT.accent} />
        </View>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={s.sidePanel}>
        <OverlayBackHeader onClose={onClose} title={t('mobile.client.routine.title')} />
        <View style={s.centered}>
          <Text style={s.emptyText}>{t('mobile.client.routine.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.sidePanel}>
      <OverlayBackHeader onClose={onClose} />
      <ScrollView contentContainerStyle={s.panelContent}>
        <RoutineHeroCard routine={routine} t={t} />
        {schedule?.mode === 'calendar' ? (
          <CalendarScheduleSections onSelectDay={handleSelectDay} schedule={schedule} t={t} />
        ) : (
          <AssignedRoutineSection days={schedule?.days ?? routine.planDays} onSelectDay={handleSelectDay} t={t} />
        )}
      </ScrollView>
      <ConfirmModal
        cancelLabel={t('client.finish.cancel')}
        confirmLabel={t('mobile.client.routine.confirmOtherDayContinue')}
        message={t('mobile.client.routine.confirmOtherDayMessage')}
        title={t('mobile.client.routine.confirmOtherDayTitle')}
        visible={pendingDay != null}
        onCancel={() => setPendingDay(null)}
        onConfirm={handleConfirmOtherDay}
      />
    </View>
  );
}

function CalendarScheduleSections(props: {
  onSelectDay: (day: ClientRoutineDay, isToday: boolean) => void;
  schedule: Extract<ReturnType<typeof resolveRoutineWeekSchedule>, { mode: 'calendar' }>;
  t: (key: string) => string;
}): React.JSX.Element {
  const { schedule, t } = props;

  return (
    <>
      <View style={styles.todaySection}>
        <Text style={s.routineSectionLabel}>{t('mobile.client.routine.today')}</Text>
        {schedule.today ? (
          <ScheduledWorkoutCard
            isActive
            onPress={() => props.onSelectDay(scheduledWorkoutToRoutineDay(schedule.today!), true)}
            subtitle={t('mobile.client.routine.scheduledToday')}
            workout={schedule.today}
          />
        ) : schedule.isRestDay ? (
          <View style={styles.restDayCard}>
            <Text style={styles.restDayTitle}>{t('mobile.client.routine.restDay')}</Text>
            <Text style={styles.restDaySubtitle}>{t('mobile.client.routine.restDayHint')}</Text>
          </View>
        ) : null}
      </View>
      {schedule.otherDays.length > 0 ? (
        <>
          <View style={s.routineSeparator} />
          <Text style={s.routineSectionLabel}>{t('mobile.client.routine.otherDays')}</Text>
          <View style={styles.otherDays}>
            {schedule.otherDays.map((workout) => (
              <ScheduledWorkoutCard
                key={`${workout.date}-${workout.planDayId}`}
                onPress={() => props.onSelectDay(scheduledWorkoutToRoutineDay(workout), false)}
                subtitle={formatScheduledDateLabel(workout.date)}
                workout={workout}
              />
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

function AssignedRoutineSection(props: {
  days: ClientRoutineDay[];
  onSelectDay: (day: ClientRoutineDay, isToday: boolean) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <>
      <Text style={s.routineSectionLabel}>{props.t('mobile.client.routine.assignedDays')}</Text>
      <View style={styles.otherDays}>
        {props.days.map((day) => (
          <RoutineDayCard key={day.id} day={day} onPress={() => props.onSelectDay(day, false)} />
        ))}
      </View>
    </>
  );
}

function RoutineHeroCard(props: { routine: ClientRoutine; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={s.routineHero}>
      <Text style={s.routineHeroName}>{props.routine.name}</Text>
      <Text style={s.routineHeroSub}>
        {`${props.routine.planDays.length} ${props.t('mobile.client.routine.trainingDays')}`}
      </Text>
      {props.routine.expectedCompletionDays ? (
        <View style={s.routineHeroMeta}>
          <Text style={s.sectionLabel}>{props.t('mobile.client.routine.mesocycle')}</Text>
          <Text style={s.fieldValue}>{`${props.routine.expectedCompletionDays} días`}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ScheduledWorkoutCard(props: {
  isActive?: boolean;
  onPress: () => void;
  subtitle: string;
  workout: ScheduledWorkout;
}): React.JSX.Element {
  const exerciseCount = props.workout.routineDay?.exercises.length;
  return (
    <Pressable onPress={props.onPress} style={[s.dayCard, props.isActive && s.dayCardActive]}>
      <View style={s.dayInfo}>
        <Text style={s.dayName}>{props.workout.title}</Text>
        <Text style={styles.daySubtitle}>{props.subtitle}</Text>
      </View>
      <View style={styles.dayRight}>
        {exerciseCount != null ? (
          <View style={s.dayExPill}>
            <Text style={s.dayExPillText}>{`${exerciseCount} ejercicios`}</Text>
          </View>
        ) : null}
        <Text style={s.dayChevron}>{'›'}</Text>
      </View>
    </Pressable>
  );
}

function RoutineDayCard(props: {
  day: ClientRoutineDay;
  isActive?: boolean;
  onPress: () => void;
  subtitle?: string;
}): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[s.dayCard, props.isActive && s.dayCardActive]}>
      <View style={s.dayInfo}>
        <Text style={s.dayName}>{props.day.title}</Text>
        <Text style={styles.daySubtitle}>{props.subtitle ?? `Día ${props.day.dayIndex}`}</Text>
      </View>
      <View style={styles.dayRight}>
        <View style={s.dayExPill}>
          <Text style={s.dayExPillText}>{`${props.day.exercises.length} ejercicios`}</Text>
        </View>
        <Text style={s.dayChevron}>{'›'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  todaySection: {
    marginBottom: 8,
  },
  restDayCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  restDayTitle: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '600',
  },
  restDaySubtitle: {
    color: LIGHT.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  otherDays: {
    gap: 16,
    marginTop: 8,
  },
  dayRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  daySubtitle: {
    color: LIGHT.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
