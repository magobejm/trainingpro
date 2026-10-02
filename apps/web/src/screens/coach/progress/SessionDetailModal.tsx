import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setVariablesForType } from '@trainerpro/shared';
import { useSessionDetailQuery } from '../../../data/hooks/useSessionDetailQuery';
import { comparePlannedAndLogged, type ComparedCell } from './session-compare.helpers';

type Props = {
  onClose: () => void;
  sessionId: null | string;
};

const COLUMN_LABEL: Record<string, string> = {
  durationSeconds: 'Duración',
  fcMaxPct: '%FC máx',
  fcReservePct: '%FC res',
  heartRate: 'Pulsaciones',
  reps: 'Reps',
  restSeconds: 'Descanso',
  rir: 'RIR',
  rom: 'ROM',
  rpe: 'RPE',
  weightKg: 'Peso',
};

export function SessionDetailModal(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useSessionDetailQuery(props.sessionId);
  return (
    <Modal onRequestClose={props.onClose} transparent visible={Boolean(props.sessionId)}>
      <Pressable onPress={props.onClose} style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('coach.progress.sessionDetail.title')}</Text>
          <Pressable onPress={props.onClose}>
            <Text style={styles.close}>{'✕'}</Text>
          </Pressable>
        </View>
        {query.isLoading ? <Text style={styles.muted}>{t('coach.progress.loading')}</Text> : null}
        <ScrollView>
          {(query.data?.items ?? []).map((item) => {
            const rows = comparePlannedAndLogged(item);
            const columns = setVariablesForType(item.type);
            return (
              <View key={item.id} style={styles.block}>
                <Text style={styles.blockTitle}>{item.displayName}</Text>
                <View style={styles.tableHead}>
                  <Text style={styles.headCell}>{'#'}</Text>
                  {columns.map((key) => (
                    <Text key={key} style={styles.headCell}>
                      {COLUMN_LABEL[key] ?? key}
                    </Text>
                  ))}
                </View>
                {rows.map((row) => (
                  <View key={row.setIndex} style={styles.tableRow}>
                    <Text style={styles.cell}>{row.setIndex}</Text>
                    {row.cells.map((cell) => (
                      <ComparedValueCell cell={cell} key={cell.key} />
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ComparedValueCell(props: { cell: ComparedCell }): React.JSX.Element {
  return (
    <Text style={[styles.cell, props.cell.differs && styles.differs]}>{`${props.cell.planned} / ${props.cell.done}`}</Text>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(15,23,42,0.4)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  block: { marginBottom: 16 },
  blockTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cell: { flex: 1, fontSize: 12 },
  close: { fontSize: 18, fontWeight: '700' },
  differs: { color: '#b45309', fontWeight: '700' },
  headCell: { color: '#64748b', flex: 1, fontSize: 11, fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  muted: { color: '#64748b', marginBottom: 12 },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    left: 24,
    maxHeight: '80%',
    padding: 16,
    position: 'absolute',
    right: 24,
    top: 48,
  },
  tableHead: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tableRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800' },
});
