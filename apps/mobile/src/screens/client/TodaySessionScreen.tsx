import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
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
import type { SessionItem, SessionView } from '../../data/hooks/useTodaySession';
import { WorkoutClock } from '../../features/timers/WorkoutClock';
import { SESSION } from '../../theme/sessionStyles';
import { LIGHT } from '../../theme/light';
import { ActiveExerciseScreen } from './ActiveExerciseScreen';
import { MiniRestTimer } from './MiniRestTimer';
import { RestTimerOverlay } from './RestTimerOverlay';
import { RoutineDayScreen } from './RoutineDayScreen';

type TodaySessionScreenProps = {
  onClose: () => void;
  sessionId: string;
};

type RestState = {
  endAt: number;
  expanded: boolean;
  seconds: number;
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
  logIntervalMutation: ReturnType<typeof useLogIntervalMutation>;
  logIsometricSetMutation: ReturnType<typeof useLogIsometricSetMutation>;
  logMobilitySetMutation: ReturnType<typeof useLogMobilitySetMutation>;
  logPlioSetMutation: ReturnType<typeof useLogPlioSetMutation>;
  logSetMutation: ReturnType<typeof useLogSetMutation>;
  logSportMutation: ReturnType<typeof useLogSportMutation>;
  onClose: () => void;
  onFinishDay: () => void;
  onRestFinish: () => void;
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
            {props.isRunning && props.restState && !props.restState.expanded ? (
              <MiniRestTimer
                endAt={props.restState.endAt}
                onPress={() => props.setRestState((prev) => (prev ? { ...prev, expanded: true } : null))}
                onFinish={props.onRestFinish}
              />
            ) : null}
            {props.isRunning ? <WorkoutClock startedAt={props.session.startedAt} onFinish={props.onFinishDay} /> : null}
          </>
        ) : null}
      </View>

      {props.selectedExercise && props.isRunning ? (
        <ActiveExerciseScreen
          exerciseGroup={props.exerciseGroup.length > 0 ? props.exerciseGroup : [props.selectedExercise]}
          item={props.selectedExercise}
          sessionId={props.sessionId}
          visible
          workoutElapsed={props.workoutElapsed}
          completedRestKeys={props.completedRestKeys}
          onClose={() => props.setSelectedExercise(null)}
          onNavigateExercise={props.setSelectedExercise}
          onFinishExercise={() => props.setSelectedExercise(null)}
          onStartRest={props.onStartRest}
          onLogSet={(input) => props.logSetMutation.mutate(input)}
          onLogPlioSet={(input) => props.logPlioSetMutation.mutate(input)}
          onLogMobilitySet={(input) => props.logMobilitySetMutation.mutate(input)}
          onLogIsometricSet={(input) => props.logIsometricSetMutation.mutate(input)}
          onLogSport={(input) => props.logSportMutation.mutate(input)}
          onLogInterval={(input) => props.logIntervalMutation.mutate(input)}
        />
      ) : null}

      {props.restState?.expanded ? (
        <RestTimerOverlay
          seconds={props.restState.seconds}
          visible
          onHide={() => props.setRestState((prev) => (prev ? { ...prev, expanded: false } : null))}
          onFinish={props.onRestFinish}
        />
      ) : null}
    </SafeAreaView>
  );
}

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

  const handleFinishDay = useCallback(() => {
    finishMutation.mutate({ isIncomplete: false }, { onSuccess: () => onClose() });
  }, [finishMutation, onClose]);

  const handleStartRest = useCallback((setKey: string, seconds: number) => {
    setCompletedRestKeys((current) => (current.includes(setKey) ? current : [...current, setKey]));
    setRestState({
      seconds,
      endAt: Date.now() + seconds * 1000,
      expanded: true,
    });
  }, []);

  const handleRestFinish = useCallback(() => {
    setRestState(null);
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
      logIntervalMutation={logIntervalMutation}
      logIsometricSetMutation={logIsometricSetMutation}
      logMobilitySetMutation={logMobilitySetMutation}
      logPlioSetMutation={logPlioSetMutation}
      logSetMutation={logSetMutation}
      logSportMutation={logSportMutation}
      onClose={onClose}
      onFinishDay={handleFinishDay}
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
