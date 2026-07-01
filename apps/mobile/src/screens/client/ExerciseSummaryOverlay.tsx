import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import type { SetLog, StrengthSessionItem } from '../../data/hooks/useTodaySession';

const MODAL_ANIMATION = 'slide';
const BACK_ARROW = '\u2190';

type ExerciseSummaryOverlayProps = {
  item: StrengthSessionItem;
  onClose: () => void;
  onEditSet: (setIndex: number) => void;
};

type SetRowProps = {
  log: SetLog;
  onEdit: () => void;
};

function SetRow({ log, onEdit }: SetRowProps) {
  const { t } = useTranslation();
  const repsLabel = t('client.label.reps');
  const kgLabel = t('client.label.kg');
  const rpeLabel = t('client.label.rpe');
  const rirLabel = t('client.label.rir');

  const parts: string[] = [];
  if (log.repsDone != null) parts.push(`${log.repsDone} ${repsLabel}`);
  if (log.weightDoneKg != null) parts.push(`${log.weightDoneKg} ${kgLabel}`);
  if (log.effortRpe != null) parts.push(`${rpeLabel} ${log.effortRpe}`);
  if (log.effortRir != null) parts.push(`${rirLabel} ${log.effortRir}`);

  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.setLabel}>{t('client.summary.set', { index: log.setIndex })}</Text>
        <Text style={rowStyles.data}>{parts.join(' · ')}</Text>
      </View>
      <Pressable style={rowStyles.editBtn} onPress={onEdit}>
        <Text style={rowStyles.editText}>{t('client.summary.edit')}</Text>
      </Pressable>
    </View>
  );
}

export function ExerciseSummaryOverlay({ item, onClose, onEditSet }: ExerciseSummaryOverlayProps) {
  const { t } = useTranslation();

  return (
    <Modal visible animationType={MODAL_ANIMATION} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backArrow}>{BACK_ARROW}</Text>
          </Pressable>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {item.displayName}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <Text style={styles.sectionTitle}>{t('client.summary.title')}</Text>
        <FlatList
          data={item.logs}
          keyExtractor={(l) => String(l.setIndex)}
          renderItem={({ item: log }) => <SetRow log={log} onEdit={() => onEditSet(log.setIndex)} />}
          contentContainerStyle={styles.list}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: SESSION.modalOverlay,
  header: {
    ...SESSION.header,
    alignItems: 'center',
    flexDirection: 'row',
  },
  backBtn: SESSION.backBtn,
  backArrow: SESSION.backArrow,
  exerciseName: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  sectionTitle: {
    color: LIGHT.accentMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 16,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  list: {
    padding: 16,
    gap: 8,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    ...SESSION.card,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: LIGHT.radiusMd,
    padding: 14,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  setLabel: {
    color: LIGHT.accentMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  data: {
    color: LIGHT.textStrong,
    fontSize: 15,
  },
  editBtn: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: {
    color: LIGHT.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
