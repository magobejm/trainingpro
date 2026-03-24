import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { useUnifiedExercisesQuery } from '../../../../data/hooks/useUnifiedLibraryQuery';

const NOTES_CATEGORY_MAP: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  warmup: 'mobilityTypes',
  sport: 'sportTypes',
};

function useNotesFallback(block: DraftBlock): string {
  const { data } = useUnifiedExercisesQuery({
    baseCategory: NOTES_CATEGORY_MAP[block.type] ?? 'muscleGroups',
    search: block.displayName,
  });
  const item = (data ?? []).find((i) => i.id === block.libraryId || i.name === block.displayName);
  return item?.coachInstructions ?? '';
}

const MODAL_ANIMATION = 'fade' as const;
const PLACEHOLDER_COLOR = '#94a3b8';

interface BlockNotesModalProps {
  block: DraftBlock;
  visible: boolean;
  isEditing: boolean;
  onClose: () => void;
  onUpdate: (v: string) => void;
  t: (k: string) => string;
}

function ModalHeader({ title }: { title: string }) {
  return <Text style={styles.headerTitle}>{title}</Text>;
}

function ModalFooterEdit({ onSave, onCancel, t }: { onSave: () => void; onCancel: () => void; t: (k: string) => string }) {
  return (
    <View style={styles.footer}>
      <Pressable onPress={onCancel} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>{t('common.cancel')}</Text>
      </Pressable>
      <Pressable onPress={onSave} style={styles.btnPrimary}>
        <Text style={styles.btnPrimaryText}>{t('common.save')}</Text>
      </Pressable>
    </View>
  );
}

function ModalFooterView({ onClose, t }: { onClose: () => void; t: (k: string) => string }) {
  return (
    <View style={styles.footer}>
      <Pressable onPress={onClose} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>{t('common.close')}</Text>
      </Pressable>
    </View>
  );
}

function noop() {}

export function BlockNotesModal(props: BlockNotesModalProps) {
  const { block, visible, isEditing, onClose, onUpdate, t } = props;
  const libraryFallback = useNotesFallback(block);
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

  const readValue = draft || libraryFallback;
  const placeholder = t('coach.routine.block.notesPlaceholder');

  return (
    <Modal animationType={MODAL_ANIMATION} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={noop} style={styles.modal}>
          <ModalHeader title={t('coach.routine.block.notes')} />
          {isEditing ? (
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.textInput}
              value={draft}
            />
          ) : (
            <Text style={[styles.readOnlyText, !readValue && styles.placeholderText]}>{readValue || placeholder}</Text>
          )}
          {isEditing ? (
            <ModalFooterEdit onCancel={onClose} onSave={handleSave} t={t} />
          ) : (
            <ModalFooterView onClose={onClose} t={t} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: 420,
    maxWidth: '90%',
    gap: 12,
  },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  textInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#334155',
    textAlignVertical: 'top',
  },
  readOnlyText: { fontSize: 14, color: '#334155', lineHeight: 22, minHeight: 80 },
  placeholderText: { color: '#94a3b8' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnSecondaryText: { color: '#475569', fontSize: 13 },
  closeBtnText: { fontSize: 20, color: '#64748b', lineHeight: 22 },
});
