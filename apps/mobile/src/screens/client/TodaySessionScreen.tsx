import React, { useCallback, useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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
import type {
  CardioSessionItem,
  IsometricSessionItem,
  LogSetMutationInput,
  MobilitySessionItem,
  PlioSessionItem,
  SessionItem,
  SessionView,
  SportSessionItem,
  StrengthSessionItem,
} from '../../data/hooks/useTodaySession';
import { SESSION } from '../../theme/sessionStyles';
import { WorkoutClock } from '../../features/timers/WorkoutClock';
import { ExerciseListCard } from './ExerciseListCard';
import { ExerciseSummaryOverlay } from './ExerciseSummaryOverlay';
import { CardioBlockOverlay } from './CardioBlockOverlay';
import { IsometricBlockOverlay } from './IsometricBlockOverlay';
import { MobilityBlockOverlay } from './MobilityBlockOverlay';
import { PlioBlockOverlay } from './PlioBlockOverlay';
import { SetWizardOverlay } from './SetWizardOverlay';
import { SportBlockOverlay } from './SportBlockOverlay';
import { StartModeModal } from './StartModeModal';
import { TimerGridList } from './TimerGridList';
import { WeeklyReportScreen } from './WeeklyReportScreen';
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
    logIntervalMutation: useLogIntervalMutation(sessionId),
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
  const [cardioOverlay, setCardioOverlay] = useState<CardioSessionItem | null>(null);
  const [plioOverlay, setPlioOverlay] = useState<PlioSessionItem | null>(null);
  const [mobilityOverlay, setMobilityOverlay] = useState<MobilitySessionItem | null>(null);
  const [isometricOverlay, setIsometricOverlay] = useState<IsometricSessionItem | null>(null);
  const [sportOverlay, setSportOverlay] = useState<SportSessionItem | null>(null);

  const handleItemPress = useCallback((item: SessionItem) => {
    if (item.type === 'strength') {
      const isFullyLogged = item.setsPlanned != null && item.logs.length >= item.setsPlanned;
      if (item.logs.length > 0 && isFullyLogged) setSummary({ item });
      else setWizard({ item });
    } else if (item.type === 'cardio') {
      setCardioOverlay(item);
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
    cardioOverlay,
    setCardioOverlay,
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

function useSessionOrchestrator(sessionId: string) {
  const sessionQuery = useSessionQuery(sessionId);
  const mutations = useSessionMutations(sessionId);
  const { startMutation, finishMutation, logSetMutation, logPlioSetMutation } = mutations;
  const { logMobilitySetMutation, logIsometricSetMutation, logSportMutation, logIntervalMutation } = mutations;
  const overlayState = useBlockOverlayState();

  const [showStartMode, setShowStartMode] = useState(false);
  const [showWellnessPre, setShowWellnessPre] = useState(false);
  const [showWellnessPost, setShowWellnessPost] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
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
        { onSuccess: () => setShowWeeklyReport(true) },
      );
    },
    [finishMutation],
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
    showWeeklyReport,
    ...overlayState,
    handleBegin,
    handleModeSelected,
    handleStartWithWellness,
    handleSkipWellness,
    handleSubmitPost,
    handleLogSet,
    logIntervalMutation,
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

type BlockOverlaysState = Pick<
  ReturnType<typeof useSessionOrchestrator>,
  | 'cardioOverlay'
  | 'setCardioOverlay'
  | 'logIntervalMutation'
  | 'plioOverlay'
  | 'setPlioOverlay'
  | 'logPlioSetMutation'
  | 'mobilityOverlay'
  | 'setMobilityOverlay'
  | 'logMobilitySetMutation'
  | 'isometricOverlay'
  | 'setIsometricOverlay'
  | 'logIsometricSetMutation'
  | 'sportOverlay'
  | 'setSportOverlay'
  | 'logSportMutation'
>;

function BlockOverlays({ sessionId, s }: { sessionId: string; s: BlockOverlaysState }) {
  return (
    <>
      {s.cardioOverlay ? (
        <CardioBlockOverlay
          item={s.cardioOverlay}
          sessionId={sessionId}
          onClose={() => s.setCardioOverlay(null)}
          onLogInterval={(input) => s.logIntervalMutation.mutate(input)}
        />
      ) : null}
      {s.plioOverlay ? (
        <PlioBlockOverlay
          item={s.plioOverlay}
          sessionId={sessionId}
          onClose={() => s.setPlioOverlay(null)}
          onLogSet={(input) => s.logPlioSetMutation.mutate(input)}
        />
      ) : null}
      {s.mobilityOverlay ? (
        <MobilityBlockOverlay
          item={s.mobilityOverlay}
          sessionId={sessionId}
          onClose={() => s.setMobilityOverlay(null)}
          onLogSet={(input) => s.logMobilitySetMutation.mutate(input)}
        />
      ) : null}
      {s.isometricOverlay ? (
        <IsometricBlockOverlay
          item={s.isometricOverlay}
          sessionId={sessionId}
          onClose={() => s.setIsometricOverlay(null)}
          onLogSet={(input) => s.logIsometricSetMutation.mutate(input)}
        />
      ) : null}
      {s.sportOverlay ? (
        <SportBlockOverlay
          item={s.sportOverlay}
          sessionId={sessionId}
          onClose={() => s.setSportOverlay(null)}
          onLog={(input) => s.logSportMutation.mutate(input)}
        />
      ) : null}
    </>
  );
}

function SessionOverlays({
  sessionId,
  onClose,
  state,
}: {
  sessionId: string;
  onClose: () => void;
  state: ReturnType<typeof useSessionOrchestrator>;
}) {
  const {
    showStartMode,
    showWellnessPre,
    showWellnessPost,
    showWeeklyReport,
    wizard,
    summary,
    handleModeSelected,
    handleStartWithWellness,
    handleSkipWellness,
    handleSubmitPost,
    handleLogSet,
    setShowStartMode,
    setShowWellnessPost,
    setWizard,
    setSummary,
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
      <BlockOverlays sessionId={sessionId} s={state} />
      {showWeeklyReport ? (
        <Modal animationType={DUMMY_MODAL_ANIMATION} visible>
          <WeeklyReportScreen sourceSessionId={sessionId} onClose={onClose} />
        </Modal>
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
  const state = useSessionOrchestrator(sessionId);

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
      <SessionOverlays sessionId={sessionId} onClose={onClose} state={state} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: SESSION.safeArea,
  container: SESSION.container,
  header: SESSION.header,
  title: SESSION.title,
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: SESSION.emptyText,
  startBanner: {
    ...SESSION.primaryBtn,
    margin: 16,
  },
  startBannerText: SESSION.primaryBtnText,
});

const listStyles = StyleSheet.create({
  list: {
    padding: 16,
  },
});
