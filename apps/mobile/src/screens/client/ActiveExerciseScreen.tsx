import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { EnqueueResult } from '../../data/hooks/useSessionDraft';
import type {
  LogIntervalMutationInput,
  LogIsometricSetMutationInput,
  LogMobilitySetMutationInput,
  LogPlioSetMutationInput,
  LogSetMutationInput,
  LogSportMutationInput,
  SessionItem,
} from '../../data/hooks/useTodaySession';
import { YouTubeVideoModal } from '../../components/YouTubeVideoModal';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import { showToast } from '../../shell/client/feedback';
import {
  elapsedRestSeconds,
  formatSessionRepRange,
  getRestSeconds,
  getSetColumns,
  getSourceExerciseId,
  getStrengthSessionItemId,
  readSessionYoutubeUrl,
  readTargetValue,
  restWasRecorded,
  setWasLogged,
  type LogPayload,
  type SetColumn,
  type SetFieldKey,
  type SetRowState,
} from './active-exercise.helpers';
import { browseOrSave, setDraftMatchesLogged } from './active-exercise.save';
import { useActiveSetDraft } from './active-exercise.draft';
import { useActiveSetSave } from './active-exercise.session';
import { useRestCountdown } from '../../features/timers/useRestCountdown';
import { CircularCountdown } from './CircularCountdown';
import { ExerciseCommentModal } from './ExerciseCommentModal';
import { ExerciseNotesPanel } from './ExerciseNotesPanel';
import { PreviousDaysOverlay } from './PreviousDaysOverlay';
import { RestTimerOverlay } from './RestTimerOverlay';
import { RomScaleModal } from './RomScaleModal';
import type { RestState } from './session-rest.types';
import {
  CurrentSetFields,
  ExerciseActionBar,
  IndicationsBanner,
  SessionFooter,
  SetChipRow,
  SetRestControl,
} from './ActiveExerciseSetPanel';

type LogResult = Promise<EnqueueResult | 'missing' | void> | void;

type ActiveExerciseScreenProps = {
  exerciseGroup: SessionItem[];
  item: SessionItem;
  readOnly?: boolean;
  sessionId: string;
  visible: boolean;
  workoutElapsed?: string;
  completedRestKeys: string[];
  onAdjustRest: (endAt: number, lastSeenAt: number) => void;
  onClose: () => void;
  onCollapseRest: () => void;
  onExpandRest: () => void;
  onFinishExercise: (itemId: string) => void;
  onNavigateExercise: (item: SessionItem) => void;
  onRestFinish: () => void;
  onLogInterval: (input: LogIntervalMutationInput) => LogResult;
  onLogIsometricSet: (input: LogIsometricSetMutationInput) => LogResult;
  onLogMobilitySet: (input: LogMobilitySetMutationInput) => LogResult;
  onLogPlioSet: (input: LogPlioSetMutationInput) => LogResult;
  onLogSet: (input: LogSetMutationInput) => LogResult;
  onLogSport: (input: LogSportMutationInput) => LogResult;
  onStartRest: (setKey: string, seconds: number) => void;
  restState: RestState | null;
};

export function ActiveExerciseScreen(props: ActiveExerciseScreenProps): React.JSX.Element {
  const draft = useActiveSetDraft(props.item);
  const save = useActiveSetSave(props.item, draft.drafts, draft.setCount, (body) => sendLoggedSet(props, body));
  return <ActiveExerciseFrame draft={draft} save={save} screen={props} />;
}

function ActiveExerciseFrame(props: {
  draft: ReturnType<typeof useActiveSetDraft>;
  save: ReturnType<typeof useActiveSetSave>;
  screen: ActiveExerciseScreenProps;
}): React.JSX.Element {
  const { t } = useTranslation();
  const screen = props.screen;
  const scrollRef = useRef<ScrollView>(null);
  const finishedRestKey = useRef<string | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const setIndex = props.draft.setIndex;
  const view = readSetView(screen.item, setIndex, props.draft.drafts[setIndex], props.save.restSeconds.current[setIndex]);
  const remaining = useRestCountdown(screen.restState, screen.onAdjustRest, () => {
    completeRest(screen, props.save, finishedRestKey);
  });
  const youtubeUrl = readSessionYoutubeUrl(screen.item);

  return (
    <Modal animationType={'slide'} onRequestClose={screen.onClose} visible={screen.visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ExerciseChrome
          indication={view.indication}
          onOpenComment={() => setShowComment(true)}
          onOpenNotes={() => setShowNotes(true)}
          onOpenVideo={() => openVideo(youtubeUrl, setShowVideo, t)}
          onSelectSet={props.draft.setCurrentSet}
          saved={savedFlags(screen, props.draft)}
          screen={screen}
          setIndex={setIndex}
          t={t}
          total={props.draft.setCount}
        />
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps={'handled'}
          ref={scrollRef}
        >
          <CurrentSetCard
            columns={view.columns}
            onFocus={(node) => scrollFieldIntoView(scrollRef.current, node)}
            onOpenHistory={() => setShowPrevious(true)}
            onOpenRom={() => props.draft.setRomSet(setIndex)}
            readOnly={screen.readOnly}
            remaining={remaining}
            screen={screen}
            setIndex={setIndex}
            setKey={view.setKey}
            t={t}
            targets={view.targets}
            total={props.draft.setCount}
            values={props.draft.drafts[setIndex] ?? {}}
            onChange={props.draft.updateField}
          />
        </ScrollView>
        <SessionFooter
          busy={props.save.busy}
          canGoBack={setIndex > 1}
          clean={view.clean}
          finishing={props.save.finishing}
          last={setIndex >= props.draft.setCount}
          onFinish={() => void props.save.finishExercise(() => screen.onFinishExercise(screen.item.id))}
          onPrevious={() => props.draft.setCurrentSet(setIndex - 1)}
          onSave={() => browseOrSave(props, setIndex, screen.readOnly === true)}
          readOnly={screen.readOnly}
          t={t}
        />
        <ExerciseOverlays
          draft={props.draft}
          onCloseComment={() => setShowComment(false)}
          onCloseNotes={() => setShowNotes(false)}
          onClosePrevious={() => setShowPrevious(false)}
          onCloseVideo={() => setShowVideo(false)}
          screen={screen}
          showComment={showComment}
          showNotes={showNotes}
          showPrevious={showPrevious}
          showVideo={showVideo}
          youtubeUrl={youtubeUrl}
        />
        {screen.restState?.expanded ? (
          <RestTimerOverlay
            onFinish={() => completeRest(screen, props.save, finishedRestKey)}
            onHide={screen.onCollapseRest}
            remaining={remaining ?? 0}
            totalSeconds={screen.restState.seconds}
            visible
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CurrentSetCard(props: {
  columns: SetColumn[];
  onChange: (key: SetFieldKey, value: string) => void;
  onFocus: (node: number) => void;
  onOpenHistory: () => void;
  onOpenRom: () => void;
  readOnly?: boolean;
  remaining: number | null;
  screen: ActiveExerciseScreenProps;
  setIndex: number;
  setKey: string;
  t: TFunction;
  targets: Record<string, string>;
  total: number;
  values: Partial<Record<SetFieldKey, string>>;
}): React.JSX.Element {
  const restSeconds = getRestSeconds(props.screen.item, props.setIndex);
  const active = props.screen.restState?.setKey === props.setKey;
  const markedDone = props.screen.completedRestKeys.includes(props.setKey);
  const restDone = markedDone || restWasRecorded(props.screen.item, props.setIndex);
  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.setTitle}>
          {props.t('mobile.client.session.setPosition', { current: props.setIndex, total: props.total })}
        </Text>
        {restSeconds > 0 ? (
          <SetRestControl
            active={active}
            completed={restDone}
            countdown={<RestCountdown remaining={props.remaining} total={restSeconds} />}
            disabled={props.readOnly === true || (props.screen.restState != null && !active)}
            onExpand={props.screen.onExpandRest}
            onStart={() => props.screen.onStartRest(props.setKey, restSeconds)}
            remaining={active ? props.remaining : null}
            restSeconds={restSeconds}
            t={props.t}
          />
        ) : null}
      </View>
      <CurrentSetFields
        columns={props.columns}
        draft={props.values}
        onChange={props.onChange}
        onFocus={props.onFocus}
        onOpenRom={props.onOpenRom}
        readOnly={props.readOnly}
        t={props.t}
        targets={props.targets}
      />
      {props.screen.item.type === 'strength' ? (
        <Pressable
          accessibilityLabel={props.t('mobile.client.session.previousDays')}
          accessibilityRole={'button'}
          onPress={props.onOpenHistory}
          style={styles.historyLink}
        >
          <Text style={styles.historyText}>{props.t('mobile.client.session.previousDays')}</Text>
        </Pressable>
      ) : null}
      {props.screen.workoutElapsed ? <Text style={styles.timer}>{props.screen.workoutElapsed}</Text> : null}
    </View>
  );
}

function RestCountdown(props: { remaining: number | null; total: number }): React.JSX.Element {
  return <CircularCountdown remaining={props.remaining ?? 0} size={40} strokeWidth={4} totalSeconds={props.total} />;
}

function ExerciseChrome(props: {
  indication: string;
  onOpenComment: () => void;
  onOpenNotes: () => void;
  onOpenVideo: () => void;
  onSelectSet: (setIndex: number) => void;
  saved: boolean[];
  screen: ActiveExerciseScreenProps;
  setIndex: number;
  t: TFunction;
  total: number;
}): React.JSX.Element {
  return (
    <>
      <ExerciseHeader
        group={props.screen.exerciseGroup}
        item={props.screen.item}
        onClose={props.screen.onClose}
        onNavigate={props.screen.onNavigateExercise}
        t={props.t}
      />
      {props.indication ? <IndicationsBanner onPress={props.onOpenNotes} t={props.t} text={props.indication} /> : null}
      <ExerciseActionBar
        onOpenComment={props.onOpenComment}
        onOpenNotes={props.onOpenNotes}
        onOpenVideo={props.onOpenVideo}
        t={props.t}
      />
      <SetChipRow
        current={props.setIndex}
        onSelect={props.onSelectSet}
        saved={props.saved}
        t={props.t}
        total={props.total}
      />
    </>
  );
}

function ExerciseHeader(props: {
  group: SessionItem[];
  item: SessionItem;
  onClose: () => void;
  onNavigate: (item: SessionItem) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  const index = props.group.findIndex((entry) => entry.id === props.item.id);
  const repsRange = formatSessionRepRange(props.item);
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel={props.t('mobile.client.back')}
        accessibilityRole={'button'}
        onPress={props.onClose}
        style={styles.backBtn}
      >
        <Text style={SESSION.backArrow}>{'←'}</Text>
      </Pressable>
      <View style={styles.titleWrap}>
        {props.group.length > 1 ? (
          <Pressable
            accessibilityLabel={props.t('mobile.client.session.previousExercise')}
            accessibilityRole={'button'}
            accessibilityState={{ disabled: index <= 0 }}
            disabled={index <= 0}
            onPress={() => props.onNavigate(props.group[index - 1]!)}
            style={styles.navBtn}
          >
            <Text style={[styles.navArrow, index <= 0 && styles.navDisabled]}>{'‹'}</Text>
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <Text numberOfLines={2} style={styles.title}>
            {props.item.displayName}
          </Text>
          {repsRange ? (
            <Text style={styles.repRange}>{`${props.t('mobile.client.session.repRange')} ${repsRange}`}</Text>
          ) : null}
        </View>
        {props.group.length > 1 ? (
          <Pressable
            accessibilityLabel={props.t('mobile.client.session.nextExercise')}
            accessibilityRole={'button'}
            accessibilityState={{ disabled: index >= props.group.length - 1 }}
            disabled={index >= props.group.length - 1}
            onPress={() => props.onNavigate(props.group[index + 1]!)}
            style={styles.navBtn}
          >
            <Text style={[styles.navArrow, index >= props.group.length - 1 && styles.navDisabled]}>{'›'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ExerciseOverlays(props: {
  draft: ReturnType<typeof useActiveSetDraft>;
  onCloseComment: () => void;
  onCloseNotes: () => void;
  onClosePrevious: () => void;
  onCloseVideo: () => void;
  screen: ActiveExerciseScreenProps;
  showComment: boolean;
  showNotes: boolean;
  showPrevious: boolean;
  showVideo: boolean;
  youtubeUrl: null | string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const romIndex = props.draft.romSet ?? props.draft.setIndex;
  return (
    <>
      <RomScaleModal
        onClose={() => props.draft.setRomSet(null)}
        onSave={props.draft.saveRom}
        value={props.draft.drafts[romIndex]?.rom ?? ''}
        visible={props.draft.romSet != null}
      />
      <YouTubeVideoModal
        onClose={props.onCloseVideo}
        title={props.screen.item.displayName}
        visible={props.showVideo}
        youtubeUrl={props.youtubeUrl}
      />
      <ExerciseCommentModal
        exerciseName={props.screen.item.displayName}
        onClose={props.onCloseComment}
        routineDayLabel={t('client.today.title')}
        sessionId={props.screen.sessionId}
        sessionItemId={getStrengthSessionItemId(props.screen.item)}
        visible={props.showComment}
      />
      {props.showNotes ? (
        <Modal animationType={'fade'} onRequestClose={props.onCloseNotes} transparent visible>
          <Pressable onPress={props.onCloseNotes} style={styles.notesOverlay}>
            <View style={styles.notesCard}>
              <ExerciseNotesPanel
                coachInstructions={props.screen.item.coachInstructions}
                trainerNote={props.screen.item.notes}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}
      <PreviousDaysOverlay
        exerciseName={props.screen.item.displayName}
        onClose={props.onClosePrevious}
        sessionId={props.screen.sessionId}
        sourceExerciseId={getSourceExerciseId(props.screen.item)}
        visible={props.showPrevious}
      />
    </>
  );
}

function completeRest(
  screen: ActiveExerciseScreenProps,
  save: ReturnType<typeof useActiveSetSave>,
  finishedRestKey: React.MutableRefObject<string | null>,
): void {
  const rest = screen.restState;
  if (!rest) return;
  const restKey = `${rest.setKey}:${rest.endAt}`;
  if (finishedRestKey.current === restKey) return;
  finishedRestKey.current = restKey;
  const setIndex = Number(rest.setKey.split(':').at(-1));
  if (Number.isInteger(setIndex) && setIndex > 0) {
    save.rememberRest(setIndex, elapsedRestSeconds(rest.endAt, rest.seconds));
    if (setWasLogged(screen.item, setIndex)) void save.run([setIndex]);
  }
  screen.onRestFinish();
}

function savedFlags(screen: ActiveExerciseScreenProps, draft: ReturnType<typeof useActiveSetDraft>): boolean[] {
  return Array.from({ length: draft.setCount }, (_, index) => {
    const setIndex = index + 1;
    const values = draft.drafts[setIndex];
    return values != null && setWasLogged(screen.item, setIndex) && setDraftMatchesLogged(screen.item, setIndex, values);
  });
}

function readSetView(item: SessionItem, setIndex: number, draft: SetRowState | undefined, restSeconds?: number) {
  const columns = getSetColumns(item);
  return {
    clean: setDraftMatchesLogged(item, setIndex, draft ?? emptyVisibleDraft(), restSeconds),
    columns,
    indication: item.coachInstructions?.trim() || item.notes?.trim() || '',
    setKey: `${item.id}:${setIndex}`,
    targets: Object.fromEntries(columns.map((column) => [column.key, readTargetValue(item, setIndex, column.key)])),
  };
}

function sendLoggedSet(props: ActiveExerciseScreenProps, body: LogPayload): LogResult {
  if ('sessionItemId' in body) return props.onLogSet(body);
  if ('sessionPlioBlockId' in body) return props.onLogPlioSet(body);
  if ('sessionMobilityBlockId' in body) return props.onLogMobilitySet(body);
  if ('sessionIsometricBlockId' in body) return props.onLogIsometricSet(body);
  if ('sessionCardioBlockId' in body) return props.onLogInterval(body);
  if ('sessionSportBlockId' in body) return props.onLogSport(body);
  return Promise.resolve('missing');
}

function openVideo(url: null | string, open: (value: boolean) => void, t: (key: string) => string): void {
  if (!url) {
    showToast(t('mobile.client.exercise.videoEmpty'));
    return;
  }
  open(true);
}

function scrollFieldIntoView(scroll: ScrollView | null, node: number): void {
  const responder = scroll?.getScrollResponder?.() as {
    scrollResponderScrollNativeHandleToKeyboard?: (nodeHandle: number, offset: number, preventNegative?: boolean) => void;
  } | null;
  responder?.scrollResponderScrollNativeHandleToKeyboard?.(node, 96, true);
}

function emptyVisibleDraft() {
  return {
    distance: '',
    duration: '',
    fcMaxPct: '',
    fcReservePct: '',
    heartRate: '',
    reps: '',
    rest: '',
    rir: '',
    rom: '',
    rpe: '',
    weight: '',
  };
}

const styles = StyleSheet.create({
  container: { backgroundColor: LIGHT.bgSoft, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, padding: 16 },
  backBtn: { ...SESSION.backBtn, height: 48, width: 48 },
  titleWrap: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 4 },
  titleBlock: { flex: 1 },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  repRange: { color: LIGHT.textMuted, fontSize: 13, textAlign: 'center' },
  navBtn: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  navArrow: { color: LIGHT.accent, fontSize: 28, fontWeight: '700' },
  navDisabled: { opacity: 0.3 },
  scroll: { padding: 16, paddingBottom: 24 },
  setCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  setHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  setTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 16, fontWeight: '800' },
  historyLink: { justifyContent: 'center', minHeight: 48 },
  historyText: { color: LIGHT.accent, fontSize: 14, fontWeight: '700' },
  timer: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '700' },
  notesOverlay: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 24 },
  notesCard: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusXl, maxHeight: '70%', padding: 16, width: '100%' },
});
