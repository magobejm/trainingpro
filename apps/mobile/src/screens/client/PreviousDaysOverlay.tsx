import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExerciseHistoryEntry } from '../../data/hooks/useTodaySession';
import { useExerciseHistoryQuery } from '../../data/hooks/useTodaySession';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import { historyCell, historyColumns, historyDate } from './exercise-history.utils';

type PreviousDaysOverlayProps = {
  sourceExerciseId: null | string;
  sessionId: string;
  exerciseName: string;
  visible: boolean;
  onClose: () => void;
};

export function PreviousDaysOverlay(props: PreviousDaysOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const query = useExerciseHistoryQuery(props.sourceExerciseId, props.sessionId, props.visible);
  return (
    <Modal visible={props.visible} animationType={'slide'} onRequestClose={props.onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t('mobile.client.history.close')}
            accessibilityRole={'button'}
            style={SESSION.backBtn}
            onPress={props.onClose}
          >
            <Text style={SESSION.backArrow}>{'←'}</Text>
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title}>{t('mobile.client.exercise.previousDays')}</Text>
            <Text style={styles.subtitle}>{props.exerciseName}</Text>
          </View>
        </View>
        {query.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={LIGHT.accent} />
          </View>
        ) : query.isError ? (
          <View style={styles.centered}>
            <Text style={styles.empty}>{t('mobile.client.history.error')}</Text>
            <Pressable accessibilityRole={'button'} onPress={() => void query.refetch()} style={styles.retry}>
              <Text style={styles.retryText}>{t('mobile.client.sync.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={query.data ?? []}
            keyExtractor={(entry: ExerciseHistoryEntry) => entry.sessionId}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<Text style={styles.hint}>{t('mobile.client.history.hint')}</Text>}
            ListEmptyComponent={<Text style={styles.empty}>{t('client.wizard.noHistory')}</Text>}
            renderItem={({ item }) => <HistoryCard entry={item} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function HistoryCard({ entry }: { entry: ExerciseHistoryEntry }): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const columns = historyColumns(entry.sets);
  const itemIds = [...new Set(entry.sets.map((set) => set.itemId))];
  const multipleItems = itemIds.length > 1;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{historyDate(entry.sessionDate, i18n.language)}</Text>
        <Text style={styles.count}>{t('mobile.client.history.setCount', { count: entry.sets.length })}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        <View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.seriesCell, styles.columnTitle]}>{t('mobile.client.history.set')}</Text>
            {columns.map((column) => (
              <Text key={column.key} style={[styles.cell, styles.columnTitle]}>
                {t(`mobile.client.history.${column.label}`)}
                {column.unit ? ` (${column.unit})` : ''}
              </Text>
            ))}
          </View>
          {entry.sets.map((set, index) => (
            <View key={`${set.itemId}:${set.setIndex}`} style={[styles.tableRow, index % 2 === 1 && styles.alternateRow]}>
              <Text style={[styles.cell, styles.seriesCell, styles.seriesNumber]}>
                {multipleItems ? `${itemIds.indexOf(set.itemId) + 1} · ${set.setIndex}` : set.setIndex}
              </Text>
              {columns.map((column) => (
                <Text key={column.key} style={styles.cell}>
                  {historyCell(set[column.key])}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {multipleItems ? <Text style={styles.cardHint}>{t('mobile.client.history.repeated')}</Text> : null}
      {columns.length > 3 ? <Text style={styles.cardHint}>{t('mobile.client.history.scroll')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...SESSION.modalOverlay },
  header: { ...SESSION.header, alignItems: 'center', flexDirection: 'row', gap: 12 },
  heading: { flex: 1, gap: 4 },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
  subtitle: { color: LIGHT.textMuted, fontSize: 14 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  empty: SESSION.emptyText,
  list: { padding: 16, paddingBottom: 32, gap: 16 },
  hint: { color: LIGHT.textMuted, fontSize: 13, lineHeight: 19 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 14,
    backgroundColor: LIGHT.accentSoft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  date: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800' },
  count: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '700' },
  tableRow: { flexDirection: 'row', alignItems: 'stretch' },
  tableHeader: { borderBottomColor: LIGHT.border, borderBottomWidth: 1 },
  columnTitle: { color: LIGHT.textMuted, fontWeight: '700', fontSize: 11 },
  cell: { color: LIGHT.textStrong, width: 82, textAlign: 'center', paddingHorizontal: 6, paddingVertical: 12, fontSize: 14 },
  seriesCell: { width: 62 },
  seriesNumber: { fontWeight: '700', color: LIGHT.accentDark },
  alternateRow: { backgroundColor: LIGHT.bgSoft },
  cardHint: { color: LIGHT.textMuted, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11 },
  retry: { backgroundColor: LIGHT.accentSoft, borderRadius: LIGHT.radiusMd, padding: 12 },
  retryText: { color: LIGHT.accentDark, fontWeight: '700' },
});
