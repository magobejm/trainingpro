/* eslint-disable max-lines-per-function */
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NeatItem } from '../../RoutinePlanner.types';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const FLAME_ICON = '\uD83D\uDD25';
const PLACEHOLDER_COLOR = colors.textMuted;
const MODAL_ANIM = 'fade' as const;
const RETURN_KEY_NEXT = 'next' as const;
const NEAT_SUGGESTIONS = [
  'Andar 10.000 pasos diarios',
  'Subir por las escaleras en lugar del ascensor',
  'Paseo de 30 minutos después de comer',
  'Ir al trabajo en bicicleta o caminando',
  'Levantarse y estirar cada hora de trabajo',
];

let neatIdCounter = Date.now();
const nextNeatId = () => `neat-${++neatIdCounter}`;

interface NeatSectionProps {
  neats: NeatItem[];
  isReadOnly?: boolean;
  onChange: (neats: NeatItem[]) => void;
  t: (k: string) => string;
}

export function NeatSection({ neats, isReadOnly, onChange, t }: NeatSectionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNeat, setEditingNeat] = useState<NeatItem | null>(null);
  const [detailNeat, setDetailNeat] = useState<NeatItem | null>(null);

  function openAdd() {
    setEditingNeat(null);
    setModalVisible(true);
  }

  function openEdit(neat: NeatItem) {
    setEditingNeat(neat);
    setModalVisible(true);
  }

  function handleSave(title: string, description: string) {
    if (editingNeat) {
      onChange(neats.map((n) => (n.id === editingNeat.id ? { ...n, title, description } : n)));
    } else {
      onChange([...neats, { id: nextNeatId(), title, description }]);
    }
    setModalVisible(false);
  }

  function handleDelete(id: string) {
    onChange(neats.filter((n) => n.id !== id));
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{FLAME_ICON}</Text>
        <Text style={styles.headerTitle}>{t('coach.routine.neat.title')}</Text>
        {!isReadOnly && (
          <Pressable onPress={openAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{`+ ${t('coach.routine.neat.add')}`}</Text>
          </Pressable>
        )}
      </View>

      {neats.length === 0 ? (
        <NeatEmptyState t={t} />
      ) : (
        <View style={styles.grid}>
          {neats.map((neat) => (
            <NeatCard
              key={neat.id}
              isReadOnly={isReadOnly}
              neat={neat}
              onDelete={() => handleDelete(neat.id)}
              onEdit={() => openEdit(neat)}
              onPress={() => setDetailNeat(neat)}
            />
          ))}
        </View>
      )}

      <NeatModal
        initialNeat={editingNeat}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        t={t}
        visible={modalVisible}
      />
      <NeatDetailModal neat={detailNeat} onClose={() => setDetailNeat(null)} t={t} />
    </View>
  );
}

function NeatEmptyState({ t }: { t: (k: string) => string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>{FLAME_ICON}</Text>
      </View>
      <Text style={styles.emptyTitle}>{t('coach.routine.neat.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('coach.routine.neat.emptySubtitle')}</Text>
    </View>
  );
}

function NeatCard({
  neat,
  isReadOnly,
  onPress,
  onEdit,
  onDelete,
}: {
  neat: NeatItem;
  isReadOnly?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardInner}>
        <Text style={styles.cardIcon}>{FLAME_ICON}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {neat.title}
        </Text>
      </View>
      {!isReadOnly && (
        <View style={styles.cardActions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onEdit();
            }}
            style={styles.cardEditBtn}
          >
            <Text style={styles.cardEditBtnText}>{'✎'}</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete();
            }}
            style={styles.cardDeleteBtn}
          >
            <Text style={styles.cardDeleteBtnText}>{'✕'}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function NeatModal({
  visible,
  initialNeat,
  onClose,
  onSave,
  t,
}: {
  visible: boolean;
  initialNeat: NeatItem | null;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  t: (k: string) => string;
}) {
  const [title, setTitle] = useState(initialNeat?.title ?? '');
  const [description, setDescription] = useState(initialNeat?.description ?? '');

  React.useEffect(() => {
    if (visible) {
      setTitle(initialNeat?.title ?? '');
      setDescription(initialNeat?.description ?? '');
    }
  }, [visible, initialNeat]);

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(trimmed, description.trim());
  }

  return (
    <Modal animationType={MODAL_ANIM} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => {}} style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backIcon}>{'‹'}</Text>
              <Text style={styles.backText}>{t('coach.library.detail.back')}</Text>
            </Pressable>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitleIcon}>{FLAME_ICON}</Text>
              <Text style={styles.modalTitle}>{t('coach.routine.neat.modalTitle')}</Text>
            </View>
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>{t('coach.routine.neat.titleLabel')}</Text>
            <TextInput
              onChangeText={setTitle}
              onSubmitEditing={handleSave}
              placeholder={t('coach.routine.neat.titlePlaceholder')}
              placeholderTextColor={PLACEHOLDER_COLOR}
              returnKeyType={RETURN_KEY_NEXT}
              style={[styles.modalInput, title.trim() ? styles.modalInputFocused : null]}
              value={title}
            />
            <Text style={styles.modalHint}>{t('coach.routine.neat.titleHint')}</Text>
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>{t('coach.routine.neat.descriptionLabel')}</Text>
            <TextInput
              multiline
              numberOfLines={3}
              onChangeText={setDescription}
              placeholder={t('coach.routine.neat.descriptionPlaceholder')}
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={description}
            />
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalSuggestionsLabel}>{t('coach.routine.neat.suggestions')}</Text>
            <View style={styles.chipsWrap}>
              {NEAT_SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => setTitle(s)} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            disabled={!title.trim()}
            onPress={handleSave}
            style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{`+ ${t('coach.routine.neat.confirm')}`}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NeatDetailModal({ neat, onClose, t }: { neat: NeatItem | null; onClose: () => void; t: (k: string) => string }) {
  if (!neat) return null;
  return (
    <Modal animationType={MODAL_ANIM} transparent visible={!!neat}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => {}} style={styles.modalBox}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>{'‹'}</Text>
            <Text style={styles.backText}>{t('coach.library.detail.back')}</Text>
          </Pressable>
          <View style={styles.detailTitleRow}>
            <Text style={styles.modalTitleIcon}>{FLAME_ICON}</Text>
            <Text style={styles.detailTitle}>{neat.title}</Text>
          </View>
          {!!neat.description && (
            <View style={styles.detailDescBox}>
              <Text style={styles.detailDescLabel}>{t('coach.routine.neat.descriptionLabel')}</Text>
              <Text style={styles.detailDescText}>{neat.description}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  headerIcon: { fontSize: fontSize.md },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addBtn: {},
  addBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.success },
  emptyState: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    gap: space.sm,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  emptyIcon: { fontSize: fontSize.xl, opacity: 0.4 },
  emptyTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  emptySubtitle: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
    minWidth: '45%',
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardIcon: { fontSize: fontSize.sm },
  cardTitle: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: space.xs },
  cardEditBtn: {
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  cardEditBtnText: { fontSize: fontSize.sm, color: colors.textMuted },
  cardDeleteBtn: {
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  cardDeleteBtnText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.xl,
    width: 500,
    maxWidth: '92%',
    gap: space.lg,
  },
  modalHeader: { gap: space.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  backIcon: { fontSize: fontSize.xl, color: colors.textMuted, lineHeight: 24 },
  backText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  modalTitleIcon: { fontSize: fontSize.xl },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  modalField: { gap: space.sm },
  modalFieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  modalInputFocused: { borderColor: colors.success },
  modalInputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  modalHint: { fontSize: fontSize.xs, color: colors.textMuted },
  modalSuggestionsLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: { fontSize: fontSize.xs, color: colors.textMuted },
  saveBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.borderStrong },
  saveBtnText: { color: colors.surface, fontWeight: '700', fontSize: fontSize.sm },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  detailTitle: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  detailDescBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailDescLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailDescText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 22 },
});
