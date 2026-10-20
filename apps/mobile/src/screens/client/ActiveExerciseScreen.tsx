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
  type SetRowState,
} from './active-exercise.helpers';
import { loggedDraft, setDraftMatchesLogged } from './active-exercise.save';
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
  ExerciseSessionFooter,
  SetSaveButton,
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
  const remaining = useRestCountdown(screen.restState, screen.onAdjustRest, () => {
    completeRest(screen, props.save, finishedRestKey);
  });
  const youtubeUrl = readSessionYoutubeUrl(screen.item);

  return (
    <Modal animationType={'slide'} onRequestClose={screen.onClose} visible={screen.visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ExerciseChrome
          onOpenComment={() => setShowComment(true)}
          onOpenNotes={() => setShowNotes(true)}
          onOpenVideo={() => openVideo(youtubeUrl, setShowVideo, t)}
          screen={screen}
          t={t}
        />
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps={'handled'}
          ref={scrollRef}
        >
          {Array.from({ length: props.draft.setCount }, (_, index) => (
            <ExerciseSetCard
              draft={props.draft}
              key={`${screen.item.id}:${index + 1}`}
              onFocus={(node) => scrollFieldIntoView(scrollRef.current, node)}
              remaining={remaining}
              save={props.save}
              screen={screen}
              setIndex={index + 1}
              t={t}
            />
          ))}
        </ScrollView>
        <ExerciseSessionFooter
          busy={props.save.busy}
          finishing={props.save.finishing}
          onFinish={() => void props.save.finishExercise(() => screen.onFinishExercise(screen.item.id))}
          onOpenHistory={screen.item.type === 'strength' ? () => setShowPrevious(true) : undefined}
          readOnly={screen.readOnly}
          t={t}
          workoutElapsed={screen.workoutElapsed}
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

function ExerciseSetCard(props: {
  draft: ReturnType<typeof useActiveSetDraft>;
  onFocus: (node: number) => void;
  remaining: number | null;
  save: ReturnType<typeof useActiveSetSave>;
  screen: ActiveExerciseScreenProps;
  setIndex: number;
  t: TFunction;
}): React.JSX.Element {
  const view = readSetView(
    props.screen.item,
    props.setIndex,
    props.draft.drafts[props.setIndex],
    props.save.restSeconds.current[props.setIndex],
  );
  const restSeconds = getRestSeconds(props.screen.item, props.setIndex);
  const active = props.screen.restState?.setKey === view.setKey;
  const markedDone = props.screen.completedRestKeys.includes(view.setKey);
  const restDone = markedDone || restWasRecorded(props.screen.item, props.setIndex);
  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.setTitle}>{`${props.t('client.today.set')} ${props.setIndex}`}</Text>
        {restSeconds > 0 ? (
          <SetRestControl
            active={active}
            completed={restDone}
            countdown={<RestCountdown remaining={props.remaining} total={restSeconds} />}
            disabled={props.screen.readOnly === true || (props.screen.restState != null && !active)}
            onExpand={props.screen.onExpandRest}
            onStart={() => props.screen.onStartRest(view.setKey, restSeconds)}
            remaining={active ? props.remaining : null}
            restSeconds={restSeconds}
            t={props.t}
          />
        ) : null}
      </View>
      <CurrentSetFields
        columns={view.columns}
        draft={props.draft.drafts[props.setIndex] ?? loggedDraft(props.screen.item, props.setIndex)}
        onChange={(key, value) => props.draft.updateField(props.setIndex, key, value)}
        onFocus={props.onFocus}
        onOpenRom={() => props.draft.setRomSet(props.setIndex)}
        readOnly={props.screen.readOnly}
        t={props.t}
        targets={view.targets}
      />
      {props.screen.readOnly ? null : (
        <SetSaveButton
          busy={props.save.busy || props.save.finishing}
          clean={view.clean}
          onSave={() => void props.save.run([props.setIndex])}
          setIndex={props.setIndex}
          t={props.t}
        />
      )}
    </View>
  );
}

function RestCountdown(props: { remaining: number | null; total: number }): React.JSX.Element {
  return <CircularCountdown remaining={props.remaining ?? 0} size={40} strokeWidth={4} totalSeconds={props.total} />;
}

function ExerciseChrome(props: {
  onOpenComment: () => void;
  onOpenNotes: () => void;
  onOpenVideo: () => void;
  screen: ActiveExerciseScreenProps;
  t: TFunction;
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
      <ExerciseActionBar
        onOpenComment={props.onOpenComment}
        onOpenNotes={props.onOpenNotes}
        onOpenVideo={props.onOpenVideo}
        t={props.t}
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
  const romIndex = props.draft.romSet ?? 1;
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
        exerciseType={props.screen.item.type}
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

function readSetView(item: SessionItem, setIndex: number, draft: SetRowState | undefined, restSeconds?: number) {
  const columns = getSetColumns(item);
  return {
    clean: setDraftMatchesLogged(item, setIndex, draft ?? loggedDraft(item, setIndex), restSeconds),
    columns,
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
  scroll: { gap: 16, padding: 16, paddingBottom: 24 },
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
  notesOverlay: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 24 },
  notesCard: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusXl, maxHeight: '70%', padding: 16, width: '100%' },
});
