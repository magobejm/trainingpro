import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HandoffWorkout, ProtectedWorkout } from '@trainerpro/shared';
import type { AskRoutineHandoff, RoutineHandoffRequest } from './routine-handoff';
import { useFormatDate } from '../../i18n/useFormatDate';
import { useRoutineHandoffReview } from './useRoutineHandoffReview';
import { Button, Modal, colors, fontSize, space } from '@trainerpro/ui';

type Translate = (key: string, options?: Record<string, unknown>) => string;

type DialogProps = { request: RoutineHandoffRequest; onCancel: () => void; onDone: () => void; t: Translate };

export function RoutineHandoffDialog({ request, onCancel, onDone, t }: DialogProps): React.JSX.Element {
  const review = useRoutineHandoffReview(request, onDone);
  const format = useFormatDate();
  const cancel = () => {
    if (review.canCancel()) onCancel();
  };
  return (
    <Modal
      closeLabel={t('common.cancel')}
      onClose={cancel}
      size="md"
      title={t('coach.routine.handoff.title')}
      visible
      footer={
        <>
          <Button label={t('common.cancel')} onPress={cancel} disabled={review.saving} variant="secondary" />
          <Button
            label={t('coach.routine.handoff.confirm')}
            onPress={() => void review.confirm()}
            disabled={!review.preview || review.loading || review.error === 'load'}
            loading={review.saving}
            variant={review.mode === 'replace' ? 'danger' : 'primary'}
          />
        </>
      }
    >
      <View style={styles.content}>
        <Text style={styles.heading}>{request.clientName}</Text>
        <Text style={styles.message}>{request.routineName}</Text>
        <Text style={styles.message}>{t('coach.routine.handoff.manualPlanning')}</Text>
        <View style={styles.choices}>
          {(['continue', 'replace'] as const).map((mode) => (
            <Button
              key={mode}
              label={t('coach.routine.handoff.' + mode)}
              onPress={() => review.setMode(mode)}
              selected={review.mode === mode}
              disabled={review.loading || review.saving}
              variant={review.mode === mode ? 'primary' : 'secondary'}
            />
          ))}
        </View>
        {review.loading ? <Text style={styles.message}>{t('coach.routine.handoff.loading')}</Text> : null}
        {review.changed ? (
          <Text accessibilityRole="alert" style={styles.message}>
            {t('coach.routine.handoff.changed')}
          </Text>
        ) : null}
        {review.error ? (
          <View style={styles.content}>
            <Text accessibilityRole="alert" style={styles.error}>
              {t('coach.routine.handoff.' + review.error + 'Error')}
            </Text>
            {review.error === 'load' ? (
              <Button label={t('coach.routine.handoff.retry')} onPress={() => void review.reload()} />
            ) : null}
          </View>
        ) : null}
        {review.preview && !review.loading ? (
          <>
            <Text style={styles.message}>{t('coach.routine.handoff.from', { date: format(review.preview.from) })}</Text>
            <View style={styles.content}>
              {review.mode === 'continue' ? (
                <WorkoutList
                  title={t('coach.routine.handoff.kept', {
                    count: review.preview.removable.length + review.preview.preserved.length,
                  })}
                  workouts={[...review.preview.removable, ...review.preview.preserved].sort(
                    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
                  )}
                  t={t}
                />
              ) : (
                <>
                  <WorkoutList
                    title={t('coach.routine.handoff.removed', { count: review.preview.removable.length })}
                    workouts={review.preview.removable}
                    t={t}
                  />
                  <WorkoutList
                    title={t('coach.routine.handoff.protected', { count: review.preview.preserved.length })}
                    workouts={review.preview.preserved}
                    t={t}
                  />
                </>
              )}
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

function WorkoutList({
  title,
  workouts,
  t,
}: {
  title: string;
  workouts: (HandoffWorkout | ProtectedWorkout)[];
  t: Translate;
}) {
  const [expanded, setExpanded] = useState(false);
  const format = useFormatDate();
  return (
    <View style={styles.content}>
      <Button variant="secondary" label={`${expanded ? '▾' : '▸'} ${title}`} onPress={() => setExpanded(!expanded)} />
      {expanded
        ? workouts.map((workout) => (
            <View key={workout.id} style={styles.row}>
              <Text
                style={styles.message}
              >{`${format(workout.date)} · ${workout.title || t('coach.calendar.type.workout')}`}</Text>
              {'reason' in workout ? (
                <Text style={styles.message}>{t('coach.routine.handoff.reason.' + workout.reason)}</Text>
              ) : null}
            </View>
          ))
        : null}
    </View>
  );
}

export function useRoutineHandoffPrompt(t: Translate): {
  ask: AskRoutineHandoff;
  dialog: React.JSX.Element;
  isOpen: boolean;
} {
  const [request, setRequest] = useState<RoutineHandoffRequest | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      resolver.current?.(false);
      resolver.current = null;
    },
    [],
  );
  const choose = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setRequest(null);
  };
  const ask: AskRoutineHandoff = (next) => {
    if (resolver.current) return Promise.resolve(false);
    setRequest(next);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  };
  return {
    ask,
    isOpen: Boolean(request),
    dialog: (
      <>
        {request ? (
          <RoutineHandoffDialog request={request} onCancel={() => choose(false)} onDone={() => choose(true)} t={t} />
        ) : null}
      </>
    ),
  };
}

const styles = StyleSheet.create({
  content: { gap: space.md },
  choices: { gap: space.sm },
  row: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  message: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
