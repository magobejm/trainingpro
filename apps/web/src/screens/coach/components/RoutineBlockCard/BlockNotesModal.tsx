import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { useUnifiedExercisesQuery } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { Button, Modal, TextField, colors, fontSize, space } from '@trainerpro/ui';

const NOTES_CATEGORY_MAP: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  mobility: 'mobilityTypes',
  sport: 'sportTypes',
};

function useLibraryInstructions(block: DraftBlock): string {
  const { data } = useUnifiedExercisesQuery({
    baseCategory: NOTES_CATEGORY_MAP[block.type] ?? 'muscleGroups',
    search: block.displayName,
  });
  const item = (data ?? []).find((i) => i.id === block.libraryId || i.name === block.displayName);
  return item?.coachInstructions ?? '';
}

interface BlockNotesModalProps {
  block: DraftBlock;
  visible: boolean;
  isEditing: boolean;
  onClose: () => void;
  onUpdate: (v: string) => void;
  t: (k: string) => string;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ModalFooterEdit({ onSave, onCancel, t }: { onSave: () => void; onCancel: () => void; t: (k: string) => string }) {
  return (
    <>
      <Button label={t('common.cancel')} onPress={onCancel} variant="secondary" />
      <Button label={t('common.save')} onPress={onSave} />
    </>
  );
}

function ModalFooterView({ onClose, t }: { onClose: () => void; t: (k: string) => string }) {
  return <Button label={t('common.close')} onPress={onClose} variant="secondary" />;
}

export function BlockNotesModal(props: BlockNotesModalProps) {
  const { block, visible, isEditing, onClose, onUpdate, t } = props;
  const libraryInstructions = useLibraryInstructions(block);
  const [draft, setDraft] = useState(block.notes ?? '');

  useEffect(() => {
    if (visible) {
      setDraft(block.notes ?? '');
    }
  }, [visible, block.notes]);

  function handleSave() {
    onUpdate(draft);
    onClose();
  }

  if (!visible) return null;

  const libraryEmpty = !libraryInstructions.trim();
  const trainerEmpty = !draft.trim();

  return (
    <Modal
      closeLabel={t('common.close')}
      dismissOnOverlay
      footer={
        isEditing ? (
          <ModalFooterEdit onCancel={onClose} onSave={handleSave} t={t} />
        ) : (
          <ModalFooterView onClose={onClose} t={t} />
        )
      }
      onClose={onClose}
      title={t('coach.routine.block.trainerNote')}
      visible={visible}
    >
      <View style={styles.body}>
        <SectionTitle title={t('coach.routine.block.libraryInstructions')} />
        <Text style={[styles.readOnlyText, libraryEmpty && styles.placeholderText]}>
          {libraryEmpty ? t('coach.routine.block.noLibraryInstructions') : libraryInstructions}
        </Text>

        <SectionTitle title={t('coach.routine.block.trainerNote')} />
        {isEditing ? (
          <TextField
            multiline
            onChangeText={setDraft}
            placeholder={t('coach.routine.block.trainerNotePlaceholder')}
            value={draft}
          />
        ) : (
          <Text style={[styles.readOnlyText, trainerEmpty && styles.placeholderText]}>
            {trainerEmpty ? t('coach.routine.block.noTrainerNote') : draft}
          </Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  readOnlyText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 22, minHeight: 40 },
  placeholderText: { color: colors.textMuted },
});
