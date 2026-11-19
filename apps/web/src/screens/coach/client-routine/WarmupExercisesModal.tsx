import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, colors, fontSize, space } from '@trainerpro/ui';
import type { RoutineEditorDay, RoutineEditorItemKind, RoutineEditorItemMeta } from '@trainerpro/shared';
import type { WarmupItemRef, WarmupRef } from '../../../data/hooks/useClientRoutine';
import { ExercisePickerModal } from '../components/RoutinePlanner/ExercisePickerModal';
import type { SetPatch } from './ClientSeriesTable';
import { RoutineItemCard, type ItemActions } from './RoutineItemCard';

type Translate = (key: string) => string;
type Warmup = RoutineEditorDay['warmups'][number];
type WarmupItem = Warmup['items'][number];
type PickerType = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

export type WarmupEditActions = {
  onAddItem: (ref: WarmupRef, item: { displayName: string; kind: RoutineEditorItemKind; libraryId: string }) => void;
  onAddSet: (ref: WarmupItemRef) => void;
  onMeta: (ref: WarmupItemRef, meta: RoutineEditorItemMeta) => void;
  onPatchSet: (ref: WarmupItemRef, setId: string, patch: SetPatch) => void;
  onRemoveItem: (ref: WarmupItemRef) => void;
  onRemoveSet: (ref: WarmupItemRef, setId: string) => void;
  onReplaceItem: (ref: WarmupItemRef, next: { displayName: string; libraryId: string }) => void;
};

type Picker = { mode: 'add'; warmupId: string } | { item: WarmupItem; mode: 'replace'; warmupId: string } | null;

const ADD_TYPES: PickerType[] = ['strength', 'cardio', 'plio', 'isometric', 'sport', 'mobility'];
const REPLACE_TYPES: Record<RoutineEditorItemKind, PickerType[]> = {
  cardio: ['cardio'],
  exercise: ['strength'],
  isometric: ['isometric'],
  mobility: ['mobility'],
  plio: ['plio'],
  sport: ['sport'],
};
const kindOf = (type: PickerType): RoutineEditorItemKind => (type === 'strength' ? 'exercise' : type);

function bind(actions: WarmupEditActions, ref: WarmupItemRef, onReplace: () => void): ItemActions {
  return {
    onAddSet: () => actions.onAddSet(ref),
    onMeta: (meta) => actions.onMeta(ref, meta),
    onPatchSet: (setId, patch) => actions.onPatchSet(ref, setId, patch),
    onRemove: () => actions.onRemoveItem(ref),
    onRemoveSet: (setId) => actions.onRemoveSet(ref, setId),
    onReplace,
  };
}

/** The exercises of the day's warm-ups, edited like the rest of the routine without touching the library warm-up. */
export function WarmupExercisesModal(props: {
  actions: WarmupEditActions;
  day: RoutineEditorDay;
  editable: boolean;
  onClose: () => void;
  t: Translate;
}): React.JSX.Element {
  const { actions, day, editable, t } = props;
  const [picker, setPicker] = useState<Picker>(null);
  const noop: ItemActions = {
    onAddSet: () => undefined,
    onMeta: () => undefined,
    onPatchSet: () => undefined,
    onRemove: () => undefined,
    onRemoveSet: () => undefined,
  };
  return (
    <>
      <Modal
        closeLabel={t('common.close')}
        onClose={props.onClose}
        size="xxl"
        title={t('coach.clientRoutine.warmup.title')}
        visible
      >
        <View style={styles.list}>
          {day.warmups.length === 0 ? <Text style={styles.empty}>{t('coach.clientRoutine.warmup.empty')}</Text> : null}
          {day.warmups.map((warmup) => (
            <View key={warmup.id} style={styles.group}>
              <Text style={styles.name}>{warmup.name}</Text>
              {warmup.items.length === 0 ? (
                <Text style={styles.empty}>{t('coach.clientRoutine.warmup.noItems')}</Text>
              ) : null}
              {warmup.items.map((item, index) => {
                const ref = { dayId: day.id, itemId: item.id, warmupId: warmup.id };
                return (
                  <RoutineItemCard
                    actions={
                      editable ? bind(actions, ref, () => setPicker({ item, mode: 'replace', warmupId: warmup.id })) : noop
                    }
                    drag={null}
                    editable={editable}
                    first={index === 0}
                    item={item}
                    key={item.id}
                    last={index === warmup.items.length - 1}
                    t={t}
                  />
                );
              })}
              {editable ? (
                <View style={styles.add}>
                  <Button
                    label={t('coach.clientRoutine.warmup.addExercise')}
                    onPress={() => setPicker({ mode: 'add', warmupId: warmup.id })}
                    size="sm"
                    variant="secondary"
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Modal>
      <ExercisePickerModal
        allowedTypes={picker?.mode === 'replace' ? REPLACE_TYPES[picker.item.kind] : ADD_TYPES}
        blockType={
          picker ? (picker.mode === 'replace' && picker.item.kind !== 'exercise' ? picker.item.kind : 'strength') : null
        }
        onCancel={() => setPicker(null)}
        onSelect={(libraryId, displayName, type) => {
          if (picker?.mode === 'add') {
            actions.onAddItem(
              { dayId: day.id, warmupId: picker.warmupId },
              { displayName, kind: kindOf((type ?? 'strength') as PickerType), libraryId },
            );
          } else if (picker?.mode === 'replace') {
            const ref = { dayId: day.id, itemId: picker.item.id, warmupId: picker.warmupId };
            actions.onReplaceItem(ref, { displayName, libraryId });
            setPicker(null);
          }
        }}
        t={t as never}
        title={picker?.mode === 'replace' ? t('coach.clientRoutine.replace') : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  add: { alignItems: 'flex-start' },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  group: { gap: space.sm, maxWidth: '100%', minWidth: 0, width: '100%' },
  list: { gap: space.lg, maxWidth: '100%', minWidth: 0, width: '100%' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
});
