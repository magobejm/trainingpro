/* eslint-disable max-lines-per-function */
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NeatItem } from '../../RoutinePlanner.types';

const FLAME_ICON = '\uD83D\uDD25';
const PLACEHOLDER_COLOR = '#94a3b8';
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: { fontSize: 16 },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addBtn: {},
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIcon: { fontSize: 20, opacity: 0.4 },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: '#475569', textAlign: 'center' },
  emptySubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    minWidth: '45%',
    flex: 1,
    backgroundColor: '#fafafa',
  },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { fontSize: 14 },
  cardTitle: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 4 },
  cardEditBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  cardEditBtnText: { fontSize: 13, color: '#475569' },
  cardDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  cardDeleteBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 500,
    maxWidth: '92%',
    gap: 16,
  },
  modalHeader: { gap: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backIcon: { fontSize: 22, color: '#64748b', lineHeight: 24 },
  backText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitleIcon: { fontSize: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  modalField: { gap: 6 },
  modalFieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
  },
  modalInputFocused: { borderColor: '#22c55e' },
  modalInputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  modalHint: { fontSize: 11, color: '#94a3b8' },
  modalSuggestionsLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  chipText: { fontSize: 12, color: '#475569' },
  saveBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#94a3b8' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1e293b' },
  detailDescBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailDescLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailDescText: { fontSize: 14, color: '#334155', lineHeight: 22 },
});
