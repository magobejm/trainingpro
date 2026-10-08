import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isDayChangeConfirmationRequired } from '../../data/api-client';
import { useClientCalendarEventsQuery } from '../../data/hooks/useClientCalendar';
import { useClientCalendarSessionsQuery } from '../../data/hooks/useClientCalendar';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { useClientPlanDayQuery, useClientRoutineQuery } from '../../data/hooks/useClientRoutineQuery';
import { useEnsureClientSessionMutation } from '../../data/hooks/useTodaySession';
import { RoutineDayScreen } from '../../screens/client/RoutineDayScreen';
import {
  formatLocalDate,
  getWeekDateRange,
  resolveDayStartGate,
  resolveRoutineWeekSchedule,
  scheduledTitleForToday,
} from '../../screens/client/routine-schedule.utils';
import { ConfirmModal } from '../../theme/ConfirmModal';
import { s } from './client-shell.styles';

type RoutineDayPreviewPanelProps = {
  day: ClientRoutineDay;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
};

/* eslint-disable max-lines-per-function -- preview start gates day-change confirm against calendar and session state. */
export function RoutineDayPreviewPanel(props: RoutineDayPreviewPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const ensureMutation = useEnsureClientSessionMutation();
  const today = useMemo(() => new Date(), []);
  const todayStr = formatLocalDate(today);
  const weekRange = useMemo(() => getWeekDateRange(today), [today]);
  const calendarQuery = useClientCalendarEventsQuery(weekRange.from, weekRange.to);
  const routineQuery = useClientRoutineQuery();
  const sessionsQuery = useClientCalendarSessionsQuery(todayStr, todayStr);
  const planDayQuery = useClientPlanDayQuery(props.day.id);
  const resolvedDay = planDayQuery.data ?? props.day;
  const [dayChangeOpen, setDayChangeOpen] = useState(false);

  const schedule = useMemo(() => {
    if (!routineQuery.data) return null;
    return resolveRoutineWeekSchedule(routineQuery.data.planDays, calendarQuery.data?.data ?? [], today);
  }, [calendarQuery.data?.data, routineQuery.data, today]);

  const startGate = useMemo(
    () =>
      resolveDayStartGate({
        calendarLoading: calendarQuery.isLoading,
        selectedPlanDayId: resolvedDay.id,
        schedule,
        todaySessionPlanDayId: sessionsQuery.data?.[0]?.planDayId ?? null,
        todaySessionStatus: sessionsQuery.data?.[0]?.status ?? null,
      }),
    [calendarQuery.isLoading, resolvedDay.id, schedule, sessionsQuery.data],
  );

  const todaySession = sessionsQuery.data?.[0] ?? null;
  const isCompleted = todaySession?.status === 'COMPLETED';
  const isInProgress = todaySession?.status === 'IN_PROGRESS';

  const startLabel = useMemo(() => {
    if (isCompleted) return t('mobile.client.session.workoutFinished');
    if (isInProgress && todaySession?.planDayId === resolvedDay.id) {
      return t('mobile.client.day.continueTraining');
    }
    return undefined;
  }, [isCompleted, isInProgress, resolvedDay.id, t, todaySession?.planDayId]);

  const runEnsureSession = useCallback(
    (confirmDayChange: boolean) => {
      ensureMutation.mutate(
        { confirmDayChange, planDayId: resolvedDay.id, sessionDate: todayStr },
        {
          onError: (error) => {
            if (!confirmDayChange && isDayChangeConfirmationRequired(error)) {
              setDayChangeOpen(true);
            }
          },
          onSuccess: (result) => {
            void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'sessions'] });
            void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'calendar'] });
            if (result.status === 'COMPLETED') {
              return;
            }
            props.onOpenSession(result.id);
          },
        },
      );
    },
    [ensureMutation, props.onOpenSession, queryClient, resolvedDay.id, todayStr],
  );

  const handleStart = useCallback(() => {
    if (startGate === 'blocked') return;
    if (startGate === 'resume' && todaySession) {
      props.onOpenSession(todaySession.id);
      return;
    }
    if (startGate === 'confirm') {
      setDayChangeOpen(true);
      return;
    }
    runEnsureSession(false);
  }, [props.onOpenSession, runEnsureSession, startGate, todaySession]);

  const handleConfirmDayChange = useCallback(() => {
    setDayChangeOpen(false);
    runEnsureSession(true);
  }, [runEnsureSession]);

  if (planDayQuery.isLoading && !planDayQuery.data) {
    return (
      <View style={s.sidePanel}>
        <View style={s.centered}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  const startError = ensureMutation.isError && !dayChangeOpen && !isDayChangeConfirmationRequired(ensureMutation.error);

  return (
    <>
      <RoutineDayScreen
        day={resolvedDay}
        mode={'preview'}
        onClose={props.onClose}
        onStart={handleStart}
        startDisabled={isCompleted || calendarQuery.isLoading}
        startError={startError}
        startLabel={startLabel}
        startPending={ensureMutation.isPending}
      />
      <ConfirmModal
        cancelLabel={t('mobile.client.dayChange.cancel')}
        confirmLabel={t('mobile.client.dayChange.confirm')}
        message={t('mobile.client.dayChange.message', {
          scheduled: scheduledTitleForToday(schedule) ?? t('mobile.client.routine.restDay'),
          selected: resolvedDay.title,
        })}
        question={t('mobile.client.dayChange.question')}
        title={t('mobile.client.dayChange.title')}
        visible={dayChangeOpen}
        onCancel={() => setDayChangeOpen(false)}
        onConfirm={handleConfirmDayChange}
      />
    </>
  );
}
