import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isDayChangeConfirmationRequired } from '../../data/api-client';
import { useClientCalendarEventsQuery } from '../../data/hooks/useClientCalendar';
import { useClientCalendarSessionsQuery, useUndoSkipClientSessionMutation } from '../../data/hooks/useClientCalendar';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { useClientPlanDayQuery, useClientRoutineQuery } from '../../data/hooks/useClientRoutineQuery';
import { useEnsureClientSessionMutation } from '../../data/hooks/useTodaySession';
import { RoutineDayScreen } from '../../screens/client/RoutineDayScreen';
import {
  describePendingMove,
  formatLocalDate,
  formatScheduledDateLabel,
  getMoveWindowRange,
  resolveDayStartGate,
  resolveRoutineWeekSchedule,
} from '../../screens/client/routine-schedule.utils';
import type { PlanDayView } from '../../screens/client/client-calendar.helpers';
import { ConfirmModal } from '../../theme/ConfirmModal';
import { s } from './client-shell.styles';

type RoutineDayPreviewPanelProps = {
  day: ClientRoutineDay;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
  view?: PlanDayView | null;
};

/* eslint-disable max-lines-per-function -- preview start gates day-change confirm against calendar and session state. */
export function RoutineDayPreviewPanel(props: RoutineDayPreviewPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const ensureMutation = useEnsureClientSessionMutation();
  const undoSkip = useUndoSkipClientSessionMutation();
  const today = useMemo(() => new Date(), []);
  const todayStr = formatLocalDate(today);
  const moveWindow = useMemo(() => getMoveWindowRange(today), [today]);
  const calendarQuery = useClientCalendarEventsQuery(moveWindow.from, moveWindow.to);
  const routineQuery = useClientRoutineQuery();
  const sessionsQuery = useClientCalendarSessionsQuery(todayStr, todayStr);
  const planDayQuery = useClientPlanDayQuery(props.day.id);
  const resolvedDay = planDayQuery.data ?? props.day;
  const [dayChangeOpen, setDayChangeOpen] = useState(false);

  const schedule = useMemo(() => {
    if (!routineQuery.data) return null;
    return resolveRoutineWeekSchedule(routineQuery.data.planDays, calendarQuery.data?.data ?? [], today);
  }, [calendarQuery.data?.data, routineQuery.data, today]);

  const sessions = sessionsQuery.data ?? [];
  const move = useMemo(
    () => describePendingMove(calendarQuery.data?.data ?? [], routineQuery.data?.planDays ?? [], resolvedDay.id, today),
    [calendarQuery.data?.data, resolvedDay.id, routineQuery.data?.planDays, today],
  );
  const startGate = useMemo(
    () =>
      resolveDayStartGate({
        calendarLoading: calendarQuery.isLoading,
        selectedPlanDayId: resolvedDay.id,
        schedule,
        sessions,
      }),
    [calendarQuery.isLoading, resolvedDay.id, schedule, sessions],
  );

  const todaySession = props.view ? null : (sessions.find((session) => session.planDayId === resolvedDay.id) ?? null);
  const viewedSessionId = reviewSessionId(props.view, todaySession);
  const isCompleted = Boolean(viewedSessionId);
  const skippedId = skipSessionId(props.view, todaySession);
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
    const sessionId = viewedSessionId ?? (isCompleted ? todaySession?.id : null);
    if (isCompleted && sessionId) {
      props.onOpenSession(sessionId);
      return;
    }
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
  }, [isCompleted, props.onOpenSession, runEnsureSession, startGate, todaySession, viewedSessionId]);

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
        startDisabled={(!isCompleted && startGate === 'blocked') || calendarQuery.isLoading}
        startError={startError}
        startLabel={isCompleted ? t('client.calendar.detail.viewSession') : startLabel}
        notice={skippedId ? skipNotice(props.view, todaySession, t) : null}
        onUndoSkip={skippedId ? () => undoSkip.mutate(skippedId) : undefined}
        startPending={ensureMutation.isPending}
        undoLabel={t('client.calendar.workout.willDo')}
      />
      <ConfirmModal
        cancelLabel={t('mobile.client.dayChange.cancel')}
        confirmLabel={t('mobile.client.dayChange.confirm')}
        message={
          move.kind === 'move'
            ? t('mobile.client.dayChange.move', {
                day: formatScheduledDateLabel(move.fromDate ?? ''),
                selected: resolvedDay.title,
              })
            : t('mobile.client.dayChange.unplanned', { selected: resolvedDay.title })
        }
        question={t('mobile.client.dayChange.question')}
        title={t('mobile.client.dayChange.title')}
        visible={dayChangeOpen}
        onCancel={() => setDayChangeOpen(false)}
        onConfirm={handleConfirmDayChange}
      />
    </>
  );
}

function reviewSessionId(view: PlanDayView | null | undefined, today: { id: string; status: string } | null): string | null {
  if (!view) return today?.status === 'COMPLETED' ? today.id : null;
  if (view.outcome === 'done' || view.outcome === 'incomplete') return view.sessionId;
  return null;
}

function skipSessionId(view: PlanDayView | null | undefined, today: { id: string; outcome?: string } | null): string | null {
  if (view?.outcome === 'skipped') return view.sessionId;
  if (!view && today?.outcome === 'skipped') return today.id;
  return null;
}

function skipNotice(
  view: PlanDayView | null | undefined,
  today: { skipReason?: string | null } | null,
  t: (key: string) => string,
): string {
  const reason = view?.skipReason ?? today?.skipReason ?? null;
  const title = t('client.calendar.workout.skipped');
  return reason ? `${title}. ${reason}` : title;
}
