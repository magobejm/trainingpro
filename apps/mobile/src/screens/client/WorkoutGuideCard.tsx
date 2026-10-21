import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { workoutGuideSteps } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';
import { useWorkoutGuide } from './WorkoutGuideContext';
import { WorkoutGuideChat } from './WorkoutGuideChat';

export type GuideSyncState = { pendingCount: number; conflictsCount: number };
type Props = GuideSyncState & {
  editable: boolean;
  location: 'day' | 'exercise';
  context: string;
  onOpenComment?: () => void;
};

export function WorkoutGuideCard(props: Props): React.JSX.Element | null {
  const guide = useWorkoutGuide();
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  if (!props.editable || !guide.hydrated || !guide.guide.eligibleForAutoStart) return null;
  const step = guide.guide.step;
  if (guide.paused)
    return (
      <View style={styles.paused}>
        <Text style={styles.body}>{t('mobile.guide.paused')}</Text>
        <GuideButton label={'resume'} onPress={() => void guide.resume()} />
      </View>
    );
  const title = guide.guide.status === 'not_started' || step === 'overview' ? 'invite' : step;
  const waitingForExercise = props.location === 'day' && (step === 'record' || step === 'save');
  return (
    <View style={styles.card} testID={'workout-guide-card'}>
      <View style={styles.header}>
        <Text style={styles.kicker}>
          {t('mobile.guide.progress', {
            current: workoutGuideSteps.indexOf(step) + 1,
            total: workoutGuideSteps.length,
          })}
        </Text>
        {guide.guide.status === 'in_progress' ? (
          <GuideButton label={'pause'} secondary onPress={() => void guide.pause()} />
        ) : null}
      </View>
      <Text accessibilityRole={'header'} style={styles.title}>
        {t(`mobile.guide.${title}.title`)}
      </Text>
      <Text style={styles.body}>{t(waitingForExercise ? 'mobile.guide.openExercise' : `mobile.guide.${title}.body`)}</Text>
      {step === 'sync' ? <SyncExplanation {...props} /> : null}
      <View style={styles.actions}>
        <GuideActions {...props} waitingForExercise={waitingForExercise} onChat={() => setChatOpen(true)} />
        <GuideButton label={'dismiss'} secondary onPress={() => void guide.dismiss()} />
      </View>
      {guide.error ? <Text style={styles.body}>{t('mobile.guide.preferenceError')}</Text> : null}
      <WorkoutGuideChat visible={chatOpen} onClose={() => setChatOpen(false)} context={props.context} />
    </View>
  );
}

function GuideActions(props: Props & { waitingForExercise: boolean; onChat: () => void }): React.JSX.Element | null {
  const guide = useWorkoutGuide();
  const step = guide.guide.step;
  if (props.waitingForExercise) return null;
  if (step === 'overview') return <GuideButton label={'start'} onPress={() => void guide.advance('record')} />;
  if (step === 'record') return <GuideButton label={'howToSave'} onPress={() => void guide.advance('save')} />;
  if (step === 'sync') return <GuideButton label={'continue'} onPress={() => void guide.advance('help')} />;
  if (step !== 'help') return null;
  return (
    <>
      {props.onOpenComment ? <GuideButton label={'comment'} secondary onPress={props.onOpenComment} /> : null}
      <GuideButton label={'chat'} secondary onPress={props.onChat} />
      <GuideButton label={'done'} onPress={() => void guide.complete()} />
    </>
  );
}

function SyncExplanation(props: GuideSyncState): React.JSX.Element {
  const { t } = useTranslation();
  const state = props.conflictsCount > 0 ? 'conflict' : props.pendingCount > 0 ? 'pending' : 'synced';
  return (
    <View style={[styles.status, state === 'conflict' && styles.conflict]}>
      <Text style={styles.body}>{t(`mobile.guide.sync.${state}`, { count: props.pendingCount })}</Text>
    </View>
  );
}

export function GuideButton(props: { label: string; onPress: () => void; secondary?: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole={'button'}
      onPress={props.onPress}
      style={({ pressed }) => [styles.button, props.secondary && styles.secondary, pressed && { opacity: 0.75 }]}
    >
      <Text style={[styles.buttonText, props.secondary && styles.secondaryText]}>{t(`mobile.guide.${props.label}`)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderWidth: 1,
    borderRadius: LIGHT.radiusLg,
    padding: 16,
    margin: 12,
    gap: 10,
  },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  kicker: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
  body: { color: LIGHT.text, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    backgroundColor: LIGHT.accent,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: LIGHT.radiusSm,
    justifyContent: 'center',
  },
  buttonText: { color: LIGHT.textOnNavy, fontWeight: '700', fontSize: 14 },
  secondary: { backgroundColor: LIGHT.bgSoft },
  secondaryText: { color: LIGHT.accentDark },
  status: { backgroundColor: LIGHT.bgSoft, padding: 12, borderRadius: LIGHT.radiusSm },
  conflict: { backgroundColor: LIGHT.redSoft },
  paused: {
    margin: 12,
    padding: 12,
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusMd,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
