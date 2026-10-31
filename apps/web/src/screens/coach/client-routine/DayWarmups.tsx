import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, colors, fontSize, space } from '@trainerpro/ui';
import type { RoutineEditorDay } from '@trainerpro/shared';
import { useWarmupTemplatesQuery } from '../../../data/hooks/useWarmupTemplates';

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

/** Warm-ups of one day: remove the ones that are there or add another from the library. */
export function DayWarmups(props: { day: RoutineEditorDay; onChange: OnWarmups; t: Translate }): React.JSX.Element {
  const { day, onChange, t } = props;
  const [picking, setPicking] = useState(false);
  const ids = day.warmups.map((item) => item.warmupTemplateId);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{t('coach.clientRoutine.warmup.title')}</Text>
      {day.warmups.map((warmup) => (
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
      ))}
      <Button label={t('coach.clientRoutine.warmup.add')} onPress={() => setPicking(true)} size="sm" variant="secondary" />
      {picking ? (
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
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  list: { gap: space.sm },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
