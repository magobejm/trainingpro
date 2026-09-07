import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { ApiClientError } from '../../data/api-client';
import {
  useFinishSessionMutation,
  useLogIntervalMutation,
  useLogIsometricSetMutation,
  useLogMobilitySetMutation,
  useLogPlioSetMutation,
  useLogSetMutation,
  useLogSportMutation,
  useSessionQuery,
  useStartSessionMutation,
} from '../../data/hooks/useTodaySession';
import type {
  LogIntervalMutationInput,
  LogIsometricSetMutationInput,
  LogMobilitySetMutationInput,
  LogPlioSetMutationInput,
  LogSetMutationInput,
  LogSportMutationInput,
  SessionItem,
  SessionView,
} from '../../data/hooks/useTodaySession';
import { SESSION } from '../../theme/sessionStyles';
import { LIGHT } from '../../theme/light';
import { showError, showToast } from '../../shell/client/feedback';
import { ActiveExerciseScreen } from './ActiveExerciseScreen';
import { RoutineDayScreen } from './RoutineDayScreen';
import type { RestState } from './session-rest.types';

type TodaySessionScreenProps = {
  onClose: () => void;
  sessionId: string;
};

function formatElapsed(startedAt: null | string): string {
  if (!startedAt) return '';
  const ms = Date.now() - new Date(startedAt).getTime();
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

type TodaySessionBodyProps = {
  completedRestKeys: string[];
  exerciseGroup: SessionItem[];
  isCompleted: boolean;
  isPending: boolean;
  isRunning: boolean;
  onLogInterval: (input: LogIntervalMutationInput) => void;
  onLogIsometricSet: (input: LogIsometricSetMutationInput) => void;
  onLogMobilitySet: (input: LogMobilitySetMutationInput) => void;
  onLogPlioSet: (input: LogPlioSetMutationInput) => void;
  onLogSet: (input: LogSetMutationInput) => void;
  onLogSport: (input: LogSportMutationInput) => void;
  onClose: () => void;
  onFinishDay: () => void;
  onRestFinish: () => void;
  onCollapseRest: () => void;
  onExpandRest: () => void;
  onSelectExercise: (item: SessionItem, group: SessionItem[]) => void;
  onStartRest: (setKey: string, seconds: number) => void;
  restState: RestState | null;
  selectedExercise: SessionItem | null;
  session: SessionView;
  sessionId: string;
  setCompletedRestKeys: React.Dispatch<React.SetStateAction<string[]>>;
  setExerciseGroup: React.Dispatch<React.SetStateAction<SessionItem[]>>;
  setRestState: React.Dispatch<React.SetStateAction<RestState | null>>;
  setSelectedExercise: React.Dispatch<React.SetStateAction<SessionItem | null>>;
  showActiveDay: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  workoutElapsed: string | undefined;
};

function TodaySessionBody(props: TodaySessionBodyProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {props.isPending ? (
          <View style={styles.pendingWrap}>
            <Text style={styles.emptyText}>{props.t('mobile.shell.loading')}</Text>
          </View>
        ) : null}

        {props.showActiveDay ? (
          <>
            <RoutineDayScreen
              mode={'active'}
              dayTitle={props.t('client.today.title')}
              exercises={props.session.items}
              session={props.session}
              onClose={props.onClose}
              onSelectExercise={props.isCompleted ? () => {} : props.onSelectExercise}
              onFinishDay={props.onFinishDay}
              workoutElapsed={props.workoutElapsed}
            />
          </>
        ) : null}
      </View>

      {props.selectedExercise && props.isRunning ? (
        <ActiveExerciseScreen
          exerciseGroup={props.exerciseGroup.length > 0 ? props.exerciseGroup : [props.selectedExercise]}
          item={props.selectedExercise}
          restState={props.restState}
          sessionId={props.sessionId}
          visible
          workoutElapsed={props.workoutElapsed}
          completedRestKeys={props.completedRestKeys}
          onClose={() => {
            props.setRestState(null);
            props.setSelectedExercise(null);
          }}
          onNavigateExercise={(item) => {
            props.setRestState(null);
            props.setSelectedExercise(item);
          }}
          onCollapseRest={props.onCollapseRest}
          onExpandRest={props.onExpandRest}
          onRestFinish={props.onRestFinish}
          onFinishExercise={() => {
            props.setRestState(null);
            props.setSelectedExercise(null);
          }}
          onStartRest={props.onStartRest}
          onLogSet={props.onLogSet}
          onLogPlioSet={props.onLogPlioSet}
          onLogMobilitySet={props.onLogMobilitySet}
          onLogIsometricSet={props.onLogIsometricSet}
          onLogSport={props.onLogSport}
          onLogInterval={props.onLogInterval}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* eslint-disable max-lines-per-function -- session screen wires mutations, rest timer, and selected exercise sync. */
export function TodaySessionScreen({ onClose, sessionId }: TodaySessionScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessionQuery = useSessionQuery(sessionId);
  const startMutation = useStartSessionMutation(sessionId);
  const finishMutation = useFinishSessionMutation(sessionId);
  const logSetMutation = useLogSetMutation(sessionId);
  const logPlioSetMutation = useLogPlioSetMutation(sessionId);
  const logMobilitySetMutation = useLogMobilitySetMutation(sessionId);
  const logIsometricSetMutation = useLogIsometricSetMutation(sessionId);
  const logSportMutation = useLogSportMutation(sessionId);
  const logIntervalMutation = useLogIntervalMutation(sessionId);

  const [selectedExercise, setSelectedExercise] = useState<SessionItem | null>(null);
  const [exerciseGroup, setExerciseGroup] = useState<SessionItem[]>([]);
  const [completedRestKeys, setCompletedRestKeys] = useState<string[]>([]);
  const [restState, setRestState] = useState<RestState | null>(null);
  const [, tick] = useState(0);

  React.useEffect(() => {
    if (!sessionQuery.data?.startedAt) return;
    const interval = setInterval(() => tick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionQuery.data?.startedAt]);

  const session = sessionQuery.data;
  const isPending = session?.status === 'PENDING';
  const isRunning = session?.status === 'IN_PROGRESS';
  const isCompleted = session?.status === 'COMPLETED';
  const showActiveDay = isRunning || isCompleted;
  const workoutElapsed = session?.startedAt ? formatElapsed(session.startedAt) : undefined;
  const autoStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (session?.status !== 'PENDING' || autoStartedRef.current || startMutation.isPending) {
      return;
    }
    autoStartedRef.current = true;
    startMutation.mutate({ startMode: 'INTERACTIVE' });
  }, [session?.status, startMutation]);

  React.useEffect(() => {
    if (!session || !selectedExercise) {
      return;
    }
    const updated = session.items.find((entry) => entry.id === selectedExercise.id);
    if (updated) {
      setSelectedExercise(updated);
    }
  }, [session, selectedExercise?.id]);

  React.useEffect(() => {
    if (!session || exerciseGroup.length === 0) {
      return;
    }
    const updatedGroup = exerciseGroup
      .map((entry) => session.items.find((item) => item.id === entry.id))
      .filter((entry): entry is SessionItem => entry != null);
    if (updatedGroup.length > 0) {
      setExerciseGroup(updatedGroup);
    }
  }, [session, exerciseGroup.map((entry) => entry.id).join('|')]);

  const handleMutationError = useCallback(
    (error: unknown) => {
      const message = error instanceof ApiClientError ? error.message : t('mobile.client.session.saveSetError');
      showError(message);
    },
    [t],
  );

  const handleLogSet = useCallback(
    (input: Parameters<ReturnType<typeof useLogSetMutation>['mutate']>[0]) => {
      logSetMutation.mutate(input, {
        onError: handleMutationError,
        onSuccess: () => showToast(t('mobile.client.session.setSaved')),
      });
    },
    [handleMutationError, logSetMutation, t],
  );

  const handleLogPlioSet = useCallback(
    (input: Parameters<ReturnType<typeof useLogPlioSetMutation>['mutate']>[0]) => {
      logPlioSetMutation.mutate(input, {
        onError: handleMutationError,
        onSuccess: () => showToast(t('mobile.client.session.setSaved')),
      });
    },
    [handleMutationError, logPlioSetMutation, t],
  );

  const handleLogMobilitySet = useCallback(
    (input: Parameters<ReturnType<typeof useLogMobilitySetMutation>['mutate']>[0]) => {
      logMobilitySetMutation.mutate(input, {
        onError: handleMutationError,
        onSuccess: () => showToast(t('mobile.client.session.setSaved')),
      });
    },
    [handleMutationError, logMobilitySetMutation, t],
  );

  const handleLogIsometricSet = useCallback(
    (input: Parameters<ReturnType<typeof useLogIsometricSetMutation>['mutate']>[0]) => {
      logIsometricSetMutation.mutate(input, {
        onError: handleMutationError,
        onSuccess: () => showToast(t('mobile.client.session.setSaved')),
      });
    },
    [handleMutationError, logIsometricSetMutation, t],
  );

  const handleLogSport = useCallback(
    (input: Parameters<ReturnType<typeof useLogSportMutation>['mutate']>[0]) => {
      logSportMutation.mutate(input, {
        onError: handleMutationError,
        onSuccess: () => showToast(t('mobile.client.session.setSaved')),
      });
    },
    [handleMutationError, logSportMutation, t],
  );

  const handleLogInterval = useCallback(
    (input: Parameters<ReturnType<typeof useLogIntervalMutation>['mutate']>[0]) => {
      logIntervalMutation.mutate(input, {
        onError: handleMutationError,
        onSuccess: () => showToast(t('mobile.client.session.setSaved')),
      });
    },
    [handleMutationError, logIntervalMutation, t],
  );

  const handleFinishDay = useCallback(() => {
    finishMutation.mutate({ isIncomplete: false }, { onSuccess: () => onClose() });
  }, [finishMutation, onClose]);

  const handleStartRest = useCallback((setKey: string, seconds: number) => {
    setRestState({
      endAt: Date.now() + seconds * 1000,
      expanded: true,
      seconds,
      setKey,
    });
  }, []);

  const handleExpandRest = useCallback(() => {
    setRestState((prev) => (prev ? { ...prev, expanded: true } : null));
  }, []);

  const handleCollapseRest = useCallback(() => {
    setRestState((prev) => (prev ? { ...prev, expanded: false } : null));
  }, []);

  const handleRestFinish = useCallback(() => {
    setRestState((prev) => {
      if (prev) {
        setCompletedRestKeys((current) => (current.includes(prev.setKey) ? current : [...current, prev.setKey]));
      }
      return null;
    });
  }, []);

  const handleSelectExercise = useCallback((item: SessionItem, group: SessionItem[]) => {
    setSelectedExercise(item);
    setExerciseGroup(group);
  }, []);

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{t('client.today.empty')}</Text>
      </View>
    );
  }

  return (
    <TodaySessionBody
      completedRestKeys={completedRestKeys}
      exerciseGroup={exerciseGroup}
      isCompleted={isCompleted}
      isPending={isPending}
      isRunning={isRunning}
      onLogInterval={handleLogInterval}
      onLogIsometricSet={handleLogIsometricSet}
      onLogMobilitySet={handleLogMobilitySet}
      onLogPlioSet={handleLogPlioSet}
      onLogSet={handleLogSet}
      onLogSport={handleLogSport}
      onClose={onClose}
      onFinishDay={handleFinishDay}
      onCollapseRest={handleCollapseRest}
      onExpandRest={handleExpandRest}
      onRestFinish={handleRestFinish}
      onSelectExercise={handleSelectExercise}
      onStartRest={handleStartRest}
      restState={restState}
      selectedExercise={selectedExercise}
      session={session}
      sessionId={sessionId}
      setCompletedRestKeys={setCompletedRestKeys}
      setExerciseGroup={setExerciseGroup}
      setRestState={setRestState}
      setSelectedExercise={setSelectedExercise}
      showActiveDay={showActiveDay}
      t={t}
      workoutElapsed={workoutElapsed}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: SESSION.safeArea,
  container: SESSION.container,
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: SESSION.emptyText,
  pendingWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  startBanner: {
    ...SESSION.primaryBtn,
    backgroundColor: LIGHT.emeraldBg,
  },
  startBannerText: SESSION.primaryBtnText,
});
