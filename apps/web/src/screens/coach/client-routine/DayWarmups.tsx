import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, colors, fontSize, space } from '@trainerpro/ui';
import type { RoutineEditorDay } from '@trainerpro/shared';
import { useWarmupTemplatesQuery } from '../../../data/hooks/useWarmupTemplates';
import { WarmupExercisesModal, type WarmupEditActions } from './WarmupExercisesModal';

type Translate = (key: string) => string;
export type OnWarmups = (dayId: string, warmupTemplateIds: string[]) => void;

function WarmupPicker(props: {
  current: string[];
  onClose: () => void;
  onPick: (id: string) => void;
  t: Translate;
}): React.JSX.Element {
  const query = useWarmupTemplatesQuery({ summary: true });
  const options = (query.data ?? []).filter((item) => !props.current.includes(item.id));
  return (
    <Modal
      closeLabel={props.t('common.close')}
      onClose={props.onClose}
      title={props.t('coach.clientRoutine.warmup.pick')}
      visible
    >
      <View style={styles.list}>
        {options.length === 0 ? <Text style={styles.empty}>{props.t('coach.clientRoutine.warmup.none')}</Text> : null}
        {options.map((item) => (
          <Button key={item.id} label={item.name} onPress={() => props.onPick(item.id)} variant="secondary" />
        ))}
      </View>
    </Modal>
  );
}

/** Warm-ups of one day: their exercises open in a modal; whole warm-ups can be removed or added from the library. */
export function DayWarmups(props: {
  actions: WarmupEditActions;
  day: RoutineEditorDay;
  editable: boolean;
  onChange: OnWarmups;
  t: Translate;
}): React.JSX.Element {
  const { actions, day, editable, onChange, t } = props;
  const [picking, setPicking] = useState(false);
  const [viewing, setViewing] = useState(false);
  const ids = day.warmups.map((item) => item.warmupTemplateId);
  const count = day.warmups.reduce((total, warmup) => total + warmup.items.length, 0);
  return (
    <View style={styles.row}>
      <Button
        label={`${t('coach.clientRoutine.warmup.title')} (${count})`}
        onPress={() => setViewing(true)}
        size="sm"
        variant="secondary"
      />
      {editable
        ? day.warmups.map((warmup) => (
            <Button
              key={warmup.id}
              label={`${warmup.name} ✕`}
              onPress={() =>
                onChange(
                  day.id,
                  ids.filter((id) => id !== warmup.warmupTemplateId),
                )
              }
              size="sm"
              variant="secondary"
            />
          ))
        : null}
      {editable ? (
        <Button label={t('coach.clientRoutine.warmup.add')} onPress={() => setPicking(true)} size="sm" variant="secondary" />
      ) : null}
      {viewing ? (
        <WarmupExercisesModal actions={actions} day={day} editable={editable} onClose={() => setViewing(false)} t={t} />
      ) : null}
      {picking && editable ? (
        <WarmupPicker
          current={ids}
          onClose={() => setPicking(false)}
          onPick={(id) => {
            onChange(day.id, [...ids, id]);
            setPicking(false);
          }}
          t={t}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  list: { gap: space.sm },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
