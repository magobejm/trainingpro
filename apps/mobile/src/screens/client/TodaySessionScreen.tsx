import React, { useCallback, useMemo, useRef, useState } from 'react';
import { WorkoutGuideCard } from './WorkoutGuideCard';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { ApiClientError } from '../../data/api-client';
import type { EnqueueResult } from '../../data/hooks/useSessionDraft';
import { useSessionQuery, sessionWritePath } from '../../data/hooks/useTodaySession';
import { applyPendingOps } from '../../data/offline/apply-pending';
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
import { startSessionPayloadFromMorningCheckin } from './session-checkin.utils';
import { useOptionalCoachNotice } from './MorningCheckinGate';
import { ShortWorkoutGuard, type ShortWorkoutStep } from './ShortWorkoutGuard';
import { freezeWorkoutDuration, isShortWorkout } from './session-rpe.utils';
import { SessionRpeModal } from './SessionRpeModal';
import { SessionAdjustmentNote } from './SessionAdjustmentNote';
import { SessionSyncBanner } from './SessionSyncBanner';
import { useOfflineSessionActions, notifyFinishedSession } from './today-session.sync';
import { WorkoutSummaryScreen } from './WorkoutSummaryScreen';
import { usePersistedSessionTimers, useWorkoutElapsed } from './today-session.timers';
import { useRestEndNotification } from '../../features/timers/rest-notification';
import { localDateKey, readTodayCheckin } from './daily-checkin.utils';
import { useAuthStore } from '../../store/auth.store';
import { useDailyCheckinStore } from '../../store/daily-checkin.store';
import type { RestState } from './session-rest.types';

type WorkoutFinishSummary = { durationSeconds: number | null; pending: boolean; sessionRpe: number };

type TodaySessionScreenProps = {
  onClose: () => void;
  onFinishedDay: () => void;
  sessionId: string;
};

type TodaySessionBodyProps = {
  exerciseSyncBanner: React.ReactNode;
  guideSync: { pendingCount: number; conflictsCount: number };
  completedRestKeys: string[];
  exerciseGroup: SessionItem[];
  finishedExerciseIds: ReadonlySet<string>;
  isCompleted: boolean;
  isPending: boolean;
  isRunning: boolean;
  onCardioDistance: (blockId: string, distanceDoneMeters: number | null) => Promise<EnqueueResult | 'missing' | void> | void;
  onLogInterval: (input: LogIntervalMutationInput) => Promise<EnqueueResult | 'missing' | void> | void;
  onLogIsometricSet: (input: LogIsometricSetMutationInput) => Promise<EnqueueResult | 'missing' | void> | void;
  onLogMobilitySet: (input: LogMobilitySetMutationInput) => Promise<EnqueueResult | 'missing' | void> | void;
  onLogPlioSet: (input: LogPlioSetMutationInput) => Promise<EnqueueResult | 'missing' | void> | void;
  onLogSet: (input: LogSetMutationInput) => Promise<EnqueueResult | 'missing' | void> | void;
  onLogSport: (input: LogSportMutationInput) => Promise<EnqueueResult | 'missing' | void> | void;
  onAdjustRest: (endAt: number, lastSeenAt: number) => void;
  onClose: () => void;
  onCloseExercise: () => void;
  onFinishDay: () => void;
  onFinishExercise: (itemId: string) => void;
  onRestFinish: () => void;
  onCollapseRest: () => void;
  onExpandRest: () => void;
  onNavigateExercise: (item: SessionItem) => void;
  onSelectExercise: (item: SessionItem, group: SessionItem[]) => void;
  onStartRest: (setKey: string, seconds: number) => void;
  onReopenRest: () => void;
  onShiftRest: (deltaSeconds: number) => void;
  banner: React.ReactNode;
  restState: RestState | null;
  selectedExercise: SessionItem | null;
  session: SessionView;
  sessionId: string;
  showActiveDay: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  workoutElapsed: string | undefined;
};

function TodaySessionBody(props: TodaySessionBodyProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {props.banner}
        {props.isPending ? (
          <View style={styles.pendingWrap}>
            <Text style={styles.emptyText}>{props.t('mobile.shell.loading')}</Text>
          </View>
        ) : null}

        {props.showActiveDay ? (
          <>
            <RoutineDayScreen
              mode={'active'}
              dayTitle={props.session.dayTitle ?? props.t('client.today.title')}
              exercises={props.session.items}
              finishedExerciseIds={props.finishedExerciseIds}
              session={props.session}
              warmups={props.session.warmups}
              onClose={props.onClose}
              onSelectExercise={props.onSelectExercise}
              onFinishDay={props.onFinishDay}
              onOpenRest={props.onReopenRest}
              onRestFinish={props.onRestFinish}
              rest={props.selectedExercise ? null : props.restState}
              workoutElapsed={props.workoutElapsed}
            />
          </>
        ) : null}
      </View>

      {props.selectedExercise && (props.isRunning || props.isCompleted) ? (
        <ActiveExerciseScreen
          guideSync={props.guideSync}
          guideContext={`${props.session.dayTitle ?? ''} · ${props.session.sessionDate}`}
          guideEditable={props.isRunning && props.session.sessionDate === localDateKey()}
          syncBanner={props.exerciseSyncBanner}
          exerciseGroup={props.exerciseGroup.length > 0 ? props.exerciseGroup : [props.selectedExercise]}
          item={props.selectedExercise}
          readOnly={props.isCompleted}
          restState={props.restState}
          sessionId={props.sessionId}
          visible
          workoutElapsed={props.workoutElapsed}
          completedRestKeys={props.completedRestKeys}
          onAdjustRest={props.onAdjustRest}
          onClose={props.onCloseExercise}
          onNavigateExercise={props.onNavigateExercise}
          onCollapseRest={props.onCollapseRest}
          onExpandRest={props.onExpandRest}
          onRestFinish={props.onRestFinish}
          onFinishExercise={props.onFinishExercise}
          onStartRest={props.onStartRest}
          onShiftRest={props.onShiftRest}
          onLogSet={props.onLogSet}
          onLogPlioSet={props.onLogPlioSet}
          onLogMobilitySet={props.onLogMobilitySet}
          onLogIsometricSet={props.onLogIsometricSet}
          onLogSport={props.onLogSport}
          onLogInterval={props.onLogInterval}
          onCardioDistance={props.onCardioDistance}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* eslint-disable max-lines-per-function -- session screen wires mutations, rest timer, and selected exercise sync. */
export function TodaySessionScreen({ onClose, onFinishedDay, sessionId }: TodaySessionScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessionQuery = useSessionQuery(sessionId);
  const actions = useOfflineSessionActions(sessionId, sessionQuery.data ?? null, sessionQuery.dataUpdatedAt);
  const rawSession = sessionQuery.data ?? actions.draft?.session ?? null;
  const pendingOps = actions.draft?.ops;
  const session = useMemo(
    () => (rawSession ? applyPendingOps(rawSession, pendingOps ?? []) : null),
    [pendingOps, rawSession],
  );

  const timers = usePersistedSessionTimers(sessionId, session, sessionQuery.data?.status);
  useRestEndNotification(timers.hydrated ? timers.restState : undefined, {
    body: t('mobile.client.rest.doneBody'),
    title: t('mobile.client.rest.doneTitle'),
  });
  const workoutElapsed = useWorkoutElapsed(session);
  const [finishedExerciseIds, setFinishedExerciseIds] = useState<Set<string>>(() => new Set());
  const [guardStep, setGuardStep] = useState<ShortWorkoutStep | null>(null);
  const [rpeVisible, setRpeVisible] = useState(false);
  const finishDurationSeconds = useRef<number | null>(null);
  const finishInstant = useRef<string | null>(null);
  const discardGuard = useRef(false);
  const [finishBusy, setFinishBusy] = useState(false);
  const startPromptedRef = React.useRef(false);
  const pendingFinishRpe = React.useRef<number | null>(null);
  const [summary, setSummary] = useState<WorkoutFinishSummary | null>(null);
  const [checkinHydrated, setCheckinHydrated] = useState(useDailyCheckinStore.persist.hasHydrated());
  const notifyCoach = useOptionalCoachNotice();
  const userId = useAuthStore((state) => state.userId);
  const entries = useDailyCheckinStore((state) => state.entries);
  const todayScores = readTodayCheckin(entries, userId, localDateKey())?.scores ?? null;

  React.useEffect(() => {
    return useDailyCheckinStore.persist.onFinishHydration(() => {
      setCheckinHydrated(true);
    });
  }, []);

  const isPending = session?.status === 'PENDING';
  const isRunning = session?.status === 'IN_PROGRESS';
  const isCompleted = session?.status === 'COMPLETED';
  const showActiveDay = isRunning || isCompleted;

  const handleMutationError = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiClientError)) {
        showError(t('mobile.client.session.saveSetError'));
        return;
      }
      if (!error.requestId) {
        showError(error.message);
        return;
      }
      const reference = t('mobile.client.session.errorRef', { id: error.requestId });
      showError(`${error.message}\n${reference}`);
    },
    [t],
  );

  React.useEffect(() => {
    const source = sessionQuery.data;
    if (!checkinHydrated || source?.status !== 'PENDING' || startPromptedRef.current) {
      return;
    }
    startPromptedRef.current = true;
    const startPayload = startSessionPayloadFromMorningCheckin(todayScores);
    void actions
      .enqueue(source, {
        body: startPayload,
        dedupeKey: 'start',
        kind: 'start',
        path: sessionWritePath(sessionId, 'start'),
      })
      .then((outcome) => {
        if (outcome === 'pending') showToast(t('mobile.client.sync.savedOffline'));
      })
      .catch((error) => {
        startPromptedRef.current = false;
        handleMutationError(error);
      });
  }, [actions, checkinHydrated, handleMutationError, sessionId, sessionQuery.data, t, todayScores]);

  const handleFinishDay = useCallback(() => {
    if (finishBusy || isCompleted) {
      return;
    }
    const seconds = session ? freezeWorkoutDuration(session) : null;
    finishDurationSeconds.current = seconds;
    finishInstant.current = new Date().toISOString();
    if (isShortWorkout(seconds)) {
      setGuardStep('register');
      return;
    }
    setRpeVisible(true);
  }, [finishBusy, isCompleted, session]);

  const handleRegisterShortWorkout = useCallback(() => {
    setGuardStep(null);
    setRpeVisible(true);
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    if (finishBusy || discardGuard.current) return;
    discardGuard.current = true;
    setFinishBusy(true);
    void actions
      .discard()
      .then(() => {
        timers.clearSessionTimers();
        setGuardStep(null);
        onClose();
      })
      .catch(() => {
        showError(t('mobile.client.session.shortDiscardOffline'));
      })
      .finally(() => {
        discardGuard.current = false;
        setFinishBusy(false);
      });
  }, [actions, finishBusy, onClose, t, timers]);

  const handleSaveSessionRpe = useCallback(
    (sessionRpe: number) => {
      if (finishBusy) return;
      setFinishBusy(true);
      void actions
        .enqueueFinish(sessionRpe, finishDurationSeconds.current, finishInstant.current)
        .then(async (outcome) => {
          if (outcome === 'conflict' || outcome === 'missing') {
            setRpeVisible(false);
            return;
          }
          timers.clearSessionTimers();
          setSummary({ durationSeconds: finishDurationSeconds.current, pending: outcome === 'pending', sessionRpe });
          setRpeVisible(false);
          if (outcome === 'pending') {
            pendingFinishRpe.current = sessionRpe;
            showToast(t('mobile.client.sync.savedOffline'));
            return;
          }
          await notifyFinishedSession(notifyCoach, sessionRpe, t);
        })
        .catch((error) => {
          handleMutationError(error);
        })
        .finally(() => setFinishBusy(false));
    },
    [actions, finishBusy, handleMutationError, notifyCoach, onFinishedDay, t, timers.clearSessionTimers],
  );

  React.useEffect(() => {
    if (pendingFinishRpe.current == null) return;
    if (session?.status !== 'COMPLETED' || actions.pendingCount > 0 || actions.conflicts.length > 0) return;
    const sessionRpe = pendingFinishRpe.current;
    pendingFinishRpe.current = null;
    setSummary((current) => (current ? { ...current, pending: false } : current));
    void notifyFinishedSession(notifyCoach, sessionRpe, t);
  }, [actions.conflicts.length, actions.pendingCount, notifyCoach, session?.status, t]);

  const handleFinishExercise = useCallback(
    (itemId: string) => {
      setFinishedExerciseIds((current) => new Set(current).add(itemId));
      timers.leaveExercise();
    },
    [timers.leaveExercise],
  );

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{t('client.today.empty')}</Text>
      </View>
    );
  }

  const syncBanner = (
    <SessionSyncBanner
      conflicts={actions.conflicts}
      onDismiss={() => {
        void actions.dismissConflicts();
      }}
      onRetry={() => {
        void actions.flush();
      }}
      pendingCount={actions.pendingCount}
    />
  );
  const guideSync = { pendingCount: actions.pendingCount, conflictsCount: actions.conflicts.length };

  return (
    <>
      <TodaySessionBody
        exerciseSyncBanner={syncBanner}
        guideSync={guideSync}
        banner={
          <>
            <SessionAdjustmentNote />
            <WorkoutGuideCard
              {...guideSync}
              location={'day'}
              editable={Boolean(isRunning && session.sessionDate === localDateKey())}
              context={`${session.dayTitle ?? ''} · ${session.sessionDate}`}
            />
            {syncBanner}
          </>
        }
        completedRestKeys={timers.completedRestKeys}
        exerciseGroup={timers.exerciseGroup}
        finishedExerciseIds={finishedExerciseIds}
        isCompleted={isCompleted}
        isPending={isPending}
        isRunning={isRunning}
        onAdjustRest={timers.onAdjustRest}
        onLogInterval={actions.handleLogInterval}
        onCardioDistance={actions.handleCardioDistance}
        onLogIsometricSet={actions.handleLogIsometricSet}
        onLogMobilitySet={actions.handleLogMobilitySet}
        onLogPlioSet={actions.handleLogPlioSet}
        onLogSet={actions.handleLogSet}
        onLogSport={actions.handleLogSport}
        onClose={onClose}
        onCloseExercise={timers.leaveExercise}
        onFinishDay={handleFinishDay}
        onFinishExercise={handleFinishExercise}
        onCollapseRest={timers.onCollapseRest}
        onExpandRest={timers.onExpandRest}
        onNavigateExercise={timers.onNavigateExercise}
        onRestFinish={timers.onRestFinish}
        onSelectExercise={timers.onSelectExercise}
        onStartRest={timers.onStartRest}
        onReopenRest={timers.onReopenRest}
        onShiftRest={timers.onShiftRest}
        restState={timers.restState}
        selectedExercise={timers.selectedExercise}
        session={session}
        sessionId={sessionId}
        showActiveDay={showActiveDay}
        t={t}
        workoutElapsed={workoutElapsed}
      />
      <ShortWorkoutGuard
        busy={finishBusy}
        step={guardStep}
        onBack={() => setGuardStep('register')}
        onConfirmMistake={handleConfirmDiscard}
        onDecline={() => setGuardStep('mistake')}
        onRegister={handleRegisterShortWorkout}
      />
      <SessionRpeModal
        isSubmitting={finishBusy}
        onClose={() => setRpeVisible(false)}
        onSubmit={handleSaveSessionRpe}
        visible={rpeVisible}
      />
      <WorkoutSummaryScreen
        durationSeconds={summary?.durationSeconds ?? null}
        onClose={() => {
          setSummary(null);
          onFinishedDay();
        }}
        recordsPending={summary?.pending === true}
        session={session}
        sessionRpe={summary?.sessionRpe ?? null}
        visible={summary != null}
      />
    </>
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
