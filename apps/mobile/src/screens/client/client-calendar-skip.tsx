import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSkipClientSessionMutation, useUndoSkipClientSessionMutation } from '../../data/hooks/useClientCalendar';
import { LIGHT } from '../../theme/light';
import { sessionSkipErrorKey } from '../../data/client-session-skip-error';
import type { DayWorkout } from './client-calendar.helpers';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function WorkoutSkipActions(props: {
  dateStr: string;
  onOpenSession?: (sessionId: string) => void;
  t: Translate;
  todayStr: string;
  workout: DayWorkout;
}): React.JSX.Element | null {
  const skip = useSkipClientSessionMutation();
  const undo = useUndoSkipClientSessionMutation();
  const [open, setOpen] = useState(false);
  const canSkip = props.workout.outcome === 'pending' && Boolean(props.workout.planDayId) && props.dateStr <= props.todayStr;
  const canUndo = props.workout.outcome === 'skipped' && Boolean(props.workout.sessionId);
  const canView = props.workout.outcome === 'incomplete' && Boolean(props.workout.sessionId) && Boolean(props.onOpenSession);
  const error = skip.isError ? skip.error : undo.isError ? undo.error : null;
  const errorKey = error ? sessionSkipErrorKey(error) : null;
  const errorText = errorKey ? props.t(errorKey) : null;
  if (!canSkip && !canUndo && !canView && !errorText) return null;
  return (
    <View style={styles.actions}>
      {errorText ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorText}
        </Text>
      ) : null}
      {canView && props.workout.sessionId ? (
        <ActionButton
          label={props.t('client.calendar.detail.viewSession')}
          onPress={() => props.onOpenSession?.(props.workout.sessionId!)}
        />
      ) : null}
      {canUndo && props.workout.sessionId ? (
        <ActionButton
          disabled={undo.isPending}
          label={props.t('client.calendar.workout.willDo')}
          onPress={() => undo.mutate(props.workout.sessionId!)}
        />
      ) : null}
      {canSkip ? <ActionButton label={props.t('client.calendar.workout.skip')} onPress={() => setOpen(true)} /> : null}
      <SkipReasonModal
        busy={skip.isPending || !canSkip || errorKey === 'client.calendar.workout.changed'}
        errorText={errorText}
        onClose={() => setOpen(false)}
        onConfirm={(reason) => {
          if (!props.workout.planDayId) return;
          skip.mutate(
            { planDayId: props.workout.planDayId, reason, sessionDate: props.dateStr },
            { onSuccess: () => setOpen(false) },
          );
        }}
        open={open}
        t={props.t}
      />
    </View>
  );
}

function ActionButton(props: { label: string; onPress: () => void; disabled?: boolean }): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" disabled={props.disabled} onPress={props.onPress} style={styles.button}>
      <Text style={styles.buttonText}>{props.label}</Text>
    </Pressable>
  );
}

function SkipReasonModal(props: {
  busy: boolean;
  errorText: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  open: boolean;
  t: Translate;
}): React.JSX.Element {
  const [reason, setReason] = useState('');
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.open}>
      <Pressable onPress={props.onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <Text style={styles.title}>{props.t('client.calendar.workout.skipTitle')}</Text>
          {props.errorText ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {props.errorText}
            </Text>
          ) : null}
          <TextInput
            onChangeText={setReason}
            placeholder={props.t('client.calendar.workout.skipReason')}
            style={styles.input}
            value={reason}
          />
          <ActionButton
            disabled={props.busy}
            label={props.t('client.calendar.workout.skipConfirm')}
            onPress={() => {
              if (!props.busy) props.onConfirm(reason);
            }}
          />
          <ActionButton label={props.t('client.start.cancel')} onPress={props.onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
  error: { color: LIGHT.error, fontSize: 14 },
  backdrop: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 24 },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  buttonText: { color: LIGHT.accentDark, fontSize: 15, fontWeight: '700' },
  input: {
    borderColor: LIGHT.border,
    borderRadius: 10,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  sheet: { backgroundColor: LIGHT.bgCard, borderRadius: 16, gap: 12, padding: 16, width: '100%' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
});
