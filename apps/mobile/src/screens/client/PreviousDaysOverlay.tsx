import React from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExerciseHistoryEntry } from '../../data/hooks/useTodaySession';
import { useExerciseHistoryQuery } from '../../data/hooks/useTodaySession';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';

type PreviousDaysOverlayProps = {
  sourceExerciseId: null | string;
  visible: boolean;
  onClose: () => void;
};

export function PreviousDaysOverlay({ sourceExerciseId, visible, onClose }: PreviousDaysOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: history, isLoading } = useExerciseHistoryQuery(sourceExerciseId);

  return (
    <Modal visible={visible} animationType={'slide'} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={SESSION.backBtn} onPress={onClose}>
            <Text style={SESSION.backArrow}>{'←'}</Text>
          </Pressable>
          <Text style={styles.title}>{t('mobile.client.exercise.previousDays')}</Text>
        </View>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={LIGHT.accent} />
          </View>
        ) : !history || history.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.empty}>{t('client.wizard.noHistory')}</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(entry: ExerciseHistoryEntry) => entry.sessionDate}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.date}>{item.sessionDate}</Text>
                <Text style={styles.data}>
                  {item.weightDoneKg != null ? `${item.weightDoneKg} ${t('client.label.kg')}` : '–'}
                  {item.repsDone != null ? ` · ${item.repsDone} ${t('client.label.reps')}` : ''}
                  {item.effortRpe != null ? ` · RPE ${item.effortRpe}` : ''}
                  {item.effortRir != null ? ` · RIR ${item.effortRir}` : ''}
                </Text>
              </View>
            )}
          />
        )}
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
    gap: 12,
  },
  title: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  empty: SESSION.emptyText,
  list: {
    padding: 16,
  },
  row: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  date: {
    color: LIGHT.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  data: {
    color: LIGHT.textStrong,
    fontSize: 14,
    fontWeight: '600',
  },
});
