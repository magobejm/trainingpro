import React, { useCallback, useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useFinishSessionMutation,
  useLogIsometricSetMutation,
  useLogMobilitySetMutation,
  useLogPlioSetMutation,
  useLogSetMutation,
  useLogSportMutation,
  useSessionQuery,
  useStartSessionMutation,
} from '../../data/hooks/useTodaySession';
import type {
  IsometricSessionItem,
  LogSetMutationInput,
  MobilitySessionItem,
  PlioSessionItem,
  SessionItem,
  SessionView,
  SportSessionItem,
  StrengthSessionItem,
} from '../../data/hooks/useTodaySession';
import { WorkoutClock } from '../../features/timers/WorkoutClock';
import { ExerciseListCard } from './ExerciseListCard';
import { ExerciseSummaryOverlay } from './ExerciseSummaryOverlay';
import { IsometricBlockOverlay } from './IsometricBlockOverlay';
import { MobilityBlockOverlay } from './MobilityBlockOverlay';
import { PlioBlockOverlay } from './PlioBlockOverlay';
import { SetWizardOverlay } from './SetWizardOverlay';
import { SportBlockOverlay } from './SportBlockOverlay';
import { StartModeModal } from './StartModeModal';
import { TimerGridList } from './TimerGridList';
import { WellnessPostModal } from './WellnessPostModal';
import { WellnessPreModal } from './WellnessPreModal';

const DUMMY_MODAL_ANIMATION = 'slide' as const;

type TodaySessionScreenProps = {
  onClose: () => void;
  sessionId: string;
};

type WizardState = {
  item: StrengthSessionItem;
  editingSetIndex?: number | null;
} | null;

type SummaryState = {
  item: StrengthSessionItem;
} | null;

function useSessionMutations(sessionId: string) {
  return {
    finishMutation: useFinishSessionMutation(sessionId),
    logIsometricSetMutation: useLogIsometricSetMutation(sessionId),
    logMobilitySetMutation: useLogMobilitySetMutation(sessionId),
    logPlioSetMutation: useLogPlioSetMutation(sessionId),
    logSetMutation: useLogSetMutation(sessionId),
    logSportMutation: useLogSportMutation(sessionId),
    startMutation: useStartSessionMutation(sessionId),
  };
}

function useBlockOverlayState() {
  const [wizard, setWizard] = useState<WizardState>(null);
  const [summary, setSummary] = useState<SummaryState>(null);
  const [plioOverlay, setPlioOverlay] = useState<PlioSessionItem | null>(null);
  const [mobilityOverlay, setMobilityOverlay] = useState<MobilitySessionItem | null>(null);
  const [isometricOverlay, setIsometricOverlay] = useState<IsometricSessionItem | null>(null);
  const [sportOverlay, setSportOverlay] = useState<SportSessionItem | null>(null);

  const handleItemPress = useCallback((item: SessionItem) => {
    if (item.type === 'strength') {
      const isFullyLogged = item.setsPlanned != null && item.logs.length >= item.setsPlanned;
      if (item.logs.length > 0 && isFullyLogged) setSummary({ item });
      else setWizard({ item });
    } else if (item.type === 'plio') {
      setPlioOverlay(item);
    } else if (item.type === 'mobility') {
      setMobilityOverlay(item);
    } else if (item.type === 'isometric') {
      setIsometricOverlay(item);
    } else if (item.type === 'sport') {
      setSportOverlay(item);
    }
  }, []);

  return {
    handleItemPress,
    wizard,
    setWizard,
    summary,
    setSummary,
    plioOverlay,
    setPlioOverlay,
    mobilityOverlay,
    setMobilityOverlay,
    isometricOverlay,
    setIsometricOverlay,
    sportOverlay,
    setSportOverlay,
  };
}

function useSessionOrchestrator(sessionId: string, onClose: () => void) {
  const sessionQuery = useSessionQuery(sessionId);
  const mutations = useSessionMutations(sessionId);
  const { startMutation, finishMutation, logSetMutation, logPlioSetMutation } = mutations;
  const { logMobilitySetMutation, logIsometricSetMutation, logSportMutation } = mutations;
  const overlayState = useBlockOverlayState();

  const [showStartMode, setShowStartMode] = useState(false);
  const [showWellnessPre, setShowWellnessPre] = useState(false);
  const [showWellnessPost, setShowWellnessPost] = useState(false);
  const [pendingMode, setPendingMode] = useState<'INTERACTIVE' | 'TIMER' | null>(null);

  const handleBegin = useCallback(() => setShowStartMode(true), []);

  const handleModeSelected = useCallback((mode: 'INTERACTIVE' | 'TIMER') => {
    setPendingMode(mode);
    setShowStartMode(false);
    setShowWellnessPre(true);
  }, []);

  const handleStartWithWellness = useCallback(
    (wellness: { motivation: number; recovery: number; fatigue: number }) => {
      setShowWellnessPre(false);
      startMutation.mutate({
        startMode: pendingMode,
        preMotivation: wellness.motivation,
        preRecovery: wellness.recovery,
        preFatigue: wellness.fatigue,
      });
    },
    [startMutation, pendingMode],
  );

  const handleSkipWellness = useCallback(() => {
    setShowWellnessPre(false);
    startMutation.mutate({ startMode: pendingMode });
  }, [startMutation, pendingMode]);

  const handleSubmitPost = useCallback(
    (values: { fatigue: number; pain: number; mood: number; comment: string }) => {
      setShowWellnessPost(false);
      finishMutation.mutate(
        {
          isIncomplete: false,
          comment: values.comment || null,
          postFatigue: values.fatigue,
          postPain: values.pain,
          postMood: values.mood,
        },
        { onSuccess: onClose },
      );
    },
    [finishMutation, onClose],
  );

  const handleLogSet = useCallback(
    (input: LogSetMutationInput) => {
      logSetMutation.mutate(input);
    },
    [logSetMutation],
  );

  return {
    session: sessionQuery.data,
    showStartMode,
    showWellnessPre,
    showWellnessPost,
    ...overlayState,
    handleBegin,
    handleModeSelected,
    handleStartWithWellness,
    handleSkipWellness,
    handleSubmitPost,
    handleLogSet,
    logPlioSetMutation,
    logMobilitySetMutation,
    logIsometricSetMutation,
    logSportMutation,
    setShowStartMode,
    setShowWellnessPost,
  };
}

function SessionItemList({ items, onItemPress }: { items: SessionItem[]; onItemPress: (i: SessionItem) => void }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <ExerciseListCard item={item} onPress={() => onItemPress(item)} />}
      contentContainerStyle={listStyles.list}
    />
  );
}

function SessionOverlays({ sessionId, state }: { sessionId: string; state: ReturnType<typeof useSessionOrchestrator> }) {
  const {
    showStartMode,
    showWellnessPre,
    showWellnessPost,
    wizard,
    summary,
    plioOverlay,
    mobilityOverlay,
    isometricOverlay,
    sportOverlay,
    handleModeSelected,
    handleStartWithWellness,
    handleSkipWellness,
    handleSubmitPost,
    handleLogSet,
    logPlioSetMutation,
    logMobilitySetMutation,
    logIsometricSetMutation,
    logSportMutation,
    setShowStartMode,
    setShowWellnessPost,
    setWizard,
    setSummary,
    setPlioOverlay,
    setMobilityOverlay,
    setIsometricOverlay,
    setSportOverlay,
  } = state;

  return (
    <>
      <StartModeModal visible={showStartMode} onSelect={handleModeSelected} onCancel={() => setShowStartMode(false)} />
      <WellnessPreModal visible={showWellnessPre} onSave={handleStartWithWellness} onSkip={handleSkipWellness} />
      <WellnessPostModal
        visible={showWellnessPost}
        onSubmit={handleSubmitPost}
        onCancel={() => setShowWellnessPost(false)}
      />
      {wizard ? (
        <SetWizardOverlay
          item={wizard.item}
          editingSetIndex={wizard.editingSetIndex}
          sessionId={sessionId}
          onClose={() => setWizard(null)}
          onLogSet={handleLogSet}
        />
      ) : null}
      {summary ? (
        <ExerciseSummaryOverlay
          item={summary.item}
          onClose={() => setSummary(null)}
          onEditSet={(setIndex) => {
            const itm = summary.item;
            setSummary(null);
            setWizard({ item: itm, editingSetIndex: setIndex });
          }}
        />
      ) : null}
      {plioOverlay ? (
        <PlioBlockOverlay
          item={plioOverlay}
          sessionId={sessionId}
          onClose={() => setPlioOverlay(null)}
          onLogSet={(input) => logPlioSetMutation.mutate(input)}
        />
      ) : null}
      {mobilityOverlay ? (
        <MobilityBlockOverlay
          item={mobilityOverlay}
          sessionId={sessionId}
          onClose={() => setMobilityOverlay(null)}
          onLogSet={(input) => logMobilitySetMutation.mutate(input)}
        />
      ) : null}
      {isometricOverlay ? (
        <IsometricBlockOverlay
          item={isometricOverlay}
          sessionId={sessionId}
          onClose={() => setIsometricOverlay(null)}
          onLogSet={(input) => logIsometricSetMutation.mutate(input)}
        />
      ) : null}
      {sportOverlay ? (
        <SportBlockOverlay
          item={sportOverlay}
          sessionId={sessionId}
          onClose={() => setSportOverlay(null)}
          onLog={(input) => logSportMutation.mutate(input)}
        />
      ) : null}
      <Modal animationType={DUMMY_MODAL_ANIMATION} transparent visible={false}>
        <View />
      </Modal>
    </>
  );
}

function SessionBody({
  session,
  sessionId,
  onItemPress,
  onLogSet,
  onFinish,
  onBegin,
}: {
  session: SessionView;
  sessionId: string;
  onItemPress: (i: SessionItem) => void;
  onLogSet: (i: LogSetMutationInput) => void;
  onFinish: () => void;
  onBegin: () => void;
}) {
  const { t } = useTranslation();
  const isRunning = session.status === 'IN_PROGRESS';
  const startMode = session.startMode ?? 'INTERACTIVE';

  return (
    <>
      {!isRunning && session.status !== 'COMPLETED' && (
        <View style={styles.startBanner}>
          <Text style={styles.startBannerText} onPress={onBegin}>
            {t('mobile.client.day.startTraining')}
          </Text>
        </View>
      )}
      {isRunning && startMode === 'TIMER' ? (
        <TimerGridList items={session.items} sessionId={sessionId} onLogSet={onLogSet} />
      ) : (
        <SessionItemList items={session.items} onItemPress={onItemPress} />
      )}
      {isRunning && <WorkoutClock startedAt={session.startedAt} onFinish={onFinish} />}
    </>
  );
}

export function TodaySessionScreen({ onClose, sessionId }: TodaySessionScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const state = useSessionOrchestrator(sessionId, onClose);

  if (!state.session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{t('client.today.empty')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('client.today.title')}</Text>
        </View>
        <SessionBody
          session={state.session}
          sessionId={sessionId}
          onItemPress={state.handleItemPress}
          onLogSet={state.handleLogSet}
          onFinish={() => state.setShowWellnessPost(true)}
          onBegin={state.handleBegin}
        />
      </View>
      <SessionOverlays sessionId={sessionId} state={state} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0f172a',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '800',
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  startBanner: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    margin: 16,
    paddingVertical: 14,
  },
  startBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

const listStyles = StyleSheet.create({
  list: {
    padding: 16,
  },
});
