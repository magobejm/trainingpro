import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useClientCalendarSessionsQuery } from '../../data/hooks/useClientCalendar';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { useClientPlanDayQuery } from '../../data/hooks/useClientRoutineQuery';
import { useEnsureClientSessionMutation } from '../../data/hooks/useTodaySession';
import { RoutineDayScreen } from '../../screens/client/RoutineDayScreen';
import { formatLocalDate } from '../../screens/client/routine-schedule.utils';
import { s } from './client-shell.styles';

type RoutineDayPreviewPanelProps = {
  day: ClientRoutineDay;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
};

export function RoutineDayPreviewPanel(props: RoutineDayPreviewPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const ensureMutation = useEnsureClientSessionMutation();
  const todayStr = formatLocalDate(new Date());
  const sessionsQuery = useClientCalendarSessionsQuery(todayStr, todayStr);
  const needsPlanDayFetch = props.day.exercises.length === 0;
  const planDayQuery = useClientPlanDayQuery(needsPlanDayFetch ? props.day.id : null);
  const resolvedDay = planDayQuery.data ?? props.day;

  const todaySession = sessionsQuery.data?.[0] ?? null;
  const isCompleted = todaySession?.status === 'COMPLETED';
  const isInProgress = todaySession?.status === 'IN_PROGRESS';

  const startLabel = useMemo(() => {
    if (isCompleted) return t('mobile.client.session.workoutFinished');
    if (isInProgress) return t('mobile.client.day.continueTraining');
    return undefined;
  }, [isCompleted, isInProgress, t]);

  const handleStart = useCallback(() => {
    if (isCompleted) return;

    if (isInProgress && todaySession) {
      props.onOpenSession(todaySession.id);
      return;
    }

    ensureMutation.mutate(
      { sessionDate: todayStr, planDayId: resolvedDay.id },
      {
        onSuccess: (result) => {
          void queryClient.invalidateQueries({ queryKey: ['clients', 'me', 'sessions'] });
          if (result.status === 'COMPLETED') {
            return;
          }
          props.onOpenSession(result.id);
        },
      },
    );
  }, [ensureMutation, isCompleted, isInProgress, props.onOpenSession, queryClient, resolvedDay.id, todaySession, todayStr]);

  if (needsPlanDayFetch && planDayQuery.isLoading) {
    return (
      <View style={s.sidePanel}>
        <View style={s.centered}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  return (
    <RoutineDayScreen
      day={resolvedDay}
      mode={'preview'}
      onClose={props.onClose}
      onStart={handleStart}
      startDisabled={isCompleted}
      startError={ensureMutation.isError || planDayQuery.isError}
      startLabel={startLabel}
      startPending={ensureMutation.isPending}
    />
  );
}
