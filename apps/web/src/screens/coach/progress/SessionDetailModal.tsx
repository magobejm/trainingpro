import { LoadingState } from '../../../components/AsyncStatus';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { sessionOutcome, usesMinuteDuration, setVariablesForType } from '@trainerpro/shared';
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
      {query.data ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {query.data.sessionDate.slice(0, 10)}
            {' · '}
            {t(
              'training.outcome.' +
                (query.data.outcome ?? sessionOutcome({ ...query.data, isCompleted: query.data.isCompleted ?? false })),
            )}
          </Text>
          {query.data.originDate ? (
            <Text style={styles.noticeText}>
              {t('training.originDate')}
              {': '}
              {query.data.originDate.slice(0, 10)}
            </Text>
          ) : null}
          {query.data.skipReason ? <Text style={styles.noticeText}>{query.data.skipReason}</Text> : null}
          {query.data.items.some((item) => typeof item.completionOrder === 'number') ? (
            <Text style={styles.noticeText}>{t('coach.progress.sessionDetail.orderInfo')}</Text>
          ) : null}
        </View>
      ) : null}
      <View>
        {(query.data?.items ?? []).map((item) => {
          const rows = comparePlannedAndLogged(item);
          const columns = setVariablesForType(item.type);
          return (
            <View key={item.id} style={styles.block}>
              <View style={styles.titleRow}>
                <Text style={styles.blockTitle}>{item.displayName}</Text>
                {typeof item.completionOrder === 'number' ? (
                  <Text style={styles.orderBadge}>
                    {t('coach.progress.sessionDetail.orderBadge', {
                      order: item.completionOrder,
                      total: query.data?.items.length ?? 0,
                    })}
                  </Text>
                ) : null}
              </View>
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
  const { t } = useTranslation();
  const done = props.cell.done === '-' ? t('training.noRecord') : props.cell.done;
  return <Text style={[styles.cell, props.cell.differs && styles.differs]}>{`${props.cell.planned} / ${done}`}</Text>;
}

const styles = StyleSheet.create({
  block: { marginBottom: space.lg },
  notice: { gap: space.xs, marginBottom: space.md },
  noticeText: { color: colors.textMuted, fontSize: fontSize.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  blockTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  orderBadge: {
    backgroundColor: colors.infoSoft,
    borderRadius: 999,
    color: colors.info,
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  cell: { color: colors.text, flex: 1, fontSize: fontSize.xs },
  differs: { color: colors.warning, fontWeight: '700' },
  headCell: { color: colors.textMuted, flex: 1, fontSize: fontSize.xs, fontWeight: '700' },
  muted: { color: colors.textMuted, marginBottom: space.md },
  tableHead: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
  tableRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
});
