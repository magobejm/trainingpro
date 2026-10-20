import { LoadingState } from '../../../components/AsyncStatus';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usesMinuteDuration, setVariablesForType } from '@trainerpro/shared';
import { useSessionDetailQuery } from '../../../data/hooks/useSessionDetailQuery';
import { comparePlannedAndLogged, type ComparedCell } from './session-compare.helpers';
import { Modal, colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  onClose: () => void;
  sessionId: null | string;
};

const COLUMN_LABEL: Record<string, string> = {
  distanceMeters: 'Distancia (km)',
  durationSeconds: 'Duración (s)',
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
    <Modal
      closeLabel={t('common.close')}
      onClose={props.onClose}
      size="lg"
      title={t('coach.progress.sessionDetail.title')}
      visible={Boolean(props.sessionId)}
    >
      {query.isLoading ? <LoadingState label={t('coach.progress.loading')} /> : null}
      {query.data?.isIncomplete ? <Text style={styles.notice}>{t('coach.progress.sessionDetail.incomplete')}</Text> : null}
      <View>
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
                    {key === 'durationSeconds' && usesMinuteDuration(item.type)
                      ? 'Duración (min)'
                      : (COLUMN_LABEL[key] ?? key)}
                  </Text>
                ))}
              </View>
              {rows.map((row) => (
                <View key={row.setIndex} style={styles.tableRow}>
                  <Text style={styles.cell}>{row.setIndex}</Text>
                  {row.cells.map((cell) => (
                    <ComparedValueCell cell={cell} incomplete={query.data?.isIncomplete === true} key={cell.key} />
                  ))}
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </Modal>
  );
}

function ComparedValueCell(props: { cell: ComparedCell; incomplete: boolean }): React.JSX.Element {
  const done = props.incomplete && props.cell.done === '-' ? '—' : props.cell.done;
  return <Text style={[styles.cell, props.cell.differs && styles.differs]}>{`${props.cell.planned} / ${done}`}</Text>;
}

const styles = StyleSheet.create({
  block: { marginBottom: space.lg },
  notice: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: space.md },
  blockTitle: { fontSize: fontSize.md, fontWeight: '800', marginBottom: space.sm },
  cell: { flex: 1, fontSize: fontSize.xs },
  differs: { color: colors.warning, fontWeight: '700' },
  headCell: { color: colors.textMuted, flex: 1, fontSize: fontSize.xs, fontWeight: '700' },
  muted: { color: colors.textMuted, marginBottom: space.md },
  tableHead: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
  tableRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
});
