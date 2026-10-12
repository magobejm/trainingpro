/* eslint-disable max-lines-per-function */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NeatItem } from '../../RoutinePlanner.types';
import { Button, EmptyState, IconButton, Modal, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const FLAME_ICON = '\uD83D\uDD25';
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
        {!isReadOnly && <Button label={`+ ${t('coach.routine.neat.add')}`} onPress={openAdd} size="sm" variant="ghost" />}
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
              t={t}
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
    <EmptyState
      icon={<Text style={styles.emptyIcon}>{FLAME_ICON}</Text>}
      message={t('coach.routine.neat.emptySubtitle')}
      title={t('coach.routine.neat.emptyTitle')}
    />
  );
}

function NeatCard({
  neat,
  isReadOnly,
  onPress,
  onEdit,
  onDelete,
  t,
}: {
  neat: NeatItem;
  isReadOnly?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: (k: string) => string;
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
          <IconButton
            accessibilityLabel={t('coach.library.exercises.actions.edit')}
            icon={(color) => <Text style={[styles.cardIconGlyph, { color }]}>{'✎'}</Text>}
            onPress={onEdit}
            size={28}
          />
          <IconButton
            accessibilityLabel={t('coach.library.exercises.actions.delete')}
            icon={(color) => <Text style={[styles.cardIconGlyph, { color }]}>{'✕'}</Text>}
            onPress={onDelete}
            size={28}
            tone="danger"
          />
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
    <Modal
      closeLabel={t('common.close')}
      footer={
        <Button disabled={!title.trim()} fullWidth label={`+ ${t('coach.routine.neat.confirm')}`} onPress={handleSave} />
      }
      onClose={onClose}
      title={`${FLAME_ICON} ${t('coach.routine.neat.modalTitle')}`}
      visible={visible}
    >
      <View style={styles.modalBody}>
        <TextField
          help={t('coach.routine.neat.titleHint')}
          label={t('coach.routine.neat.titleLabel')}
          onChangeText={setTitle}
          onSubmitEditing={handleSave}
          placeholder={t('coach.routine.neat.titlePlaceholder')}
          required
          returnKeyType={RETURN_KEY_NEXT}
          value={title}
        />
        <TextField
          label={t('coach.routine.neat.descriptionLabel')}
          multiline
          numberOfLines={3}
          onChangeText={setDescription}
          placeholder={t('coach.routine.neat.descriptionPlaceholder')}
          value={description}
        />
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
      </View>
    </Modal>
  );
}

function NeatDetailModal({ neat, onClose, t }: { neat: NeatItem | null; onClose: () => void; t: (k: string) => string }) {
  if (!neat) return null;
  return (
    <Modal
      closeLabel={t('common.close')}
      dismissOnOverlay
      footer={<Button label={t('common.close')} onPress={onClose} variant="secondary" />}
      onClose={onClose}
      title={`${FLAME_ICON} ${neat.title}`}
      visible={!!neat}
    >
      {!!neat.description && (
        <View style={styles.detailDescBox}>
          <Text style={styles.detailDescLabel}>{t('coach.routine.neat.descriptionLabel')}</Text>
          <Text style={styles.detailDescText}>{neat.description}</Text>
        </View>
      )}
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
  emptyIcon: { fontSize: fontSize.xl, opacity: 0.4 },
  cardIconGlyph: { fontSize: fontSize.sm, fontWeight: '700' },
  modalBody: { gap: space.lg },
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
  modalField: { gap: space.sm },
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
