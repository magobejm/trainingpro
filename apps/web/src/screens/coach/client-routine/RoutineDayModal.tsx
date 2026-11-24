import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, TextField, colors, fontSize, space } from '@trainerpro/ui';

export type DayModalState =
  | { mode: 'add' }
  | { dayId: string; mode: 'rename'; title: string }
  | { dayId: string; mode: 'delete'; title: string }
  | null;

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** One dialog for the three things the coach can do with a day of their own: add it, rename it, delete it. */
export function RoutineDayModal(props: {
  onAdd: (title: string) => void;
  onClose: () => void;
  onDelete: (dayId: string) => void;
  onRename: (dayId: string, title: string) => void;
  state: DayModalState;
  t: Translate;
}): React.JSX.Element | null {
  const { state, t } = props;
  const [title, setTitle] = useState('');
  useEffect(() => {
    setTitle(state?.mode === 'rename' ? state.title : '');
  }, [state]);
  if (!state) return null;
  const trimmed = title.trim();
  const submit = () => {
    if (state.mode === 'delete') props.onDelete(state.dayId);
    else if (!trimmed) return;
    else if (state.mode === 'add') props.onAdd(trimmed);
    else props.onRename(state.dayId, trimmed);
    props.onClose();
  };
  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <Button
          disabled={state.mode !== 'delete' && !trimmed}
          fullWidth
          label={t(`coach.clientRoutine.day.${state.mode}.confirm`)}
          onPress={submit}
          variant={state.mode === 'delete' ? 'danger' : 'primary'}
        />
      }
      onClose={props.onClose}
      title={t(`coach.clientRoutine.day.${state.mode}.title`)}
      visible
    >
      <View style={styles.body}>
        {state.mode === 'delete' ? (
          <Text style={styles.text}>{t('coach.clientRoutine.day.delete.message', { title: state.title })}</Text>
        ) : (
          <>
            <TextField
              label={t('coach.clientRoutine.day.titleLabel')}
              onChangeText={setTitle}
              onSubmitEditing={submit}
              placeholder={t('coach.clientRoutine.day.titlePlaceholder')}
              required
              value={title}
            />
            {state.mode === 'add' ? <Text style={styles.text}>{t('coach.clientRoutine.day.add.hint')}</Text> : null}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  text: { color: colors.textMuted, fontSize: fontSize.sm },
});
