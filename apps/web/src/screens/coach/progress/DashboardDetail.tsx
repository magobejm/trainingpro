import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Modal, colors, space } from '@trainerpro/ui';
import type { ProgressAuditSet, ProgressDailyPoint } from '@trainerpro/shared';
import { DashboardChart, type DashboardMetric } from './DashboardChart';
import { dashboardStyles as styles } from './dashboard.styles';
import { formatMetric, metricSummary, type DashboardPoint } from './dashboard-model';

export function DashboardDetail(props: {
  metric: DashboardMetric;
  points: DashboardPoint[];
  daily?: ProgressDailyPoint[];
  compare?: boolean;
  connectNulls?: boolean;
  cycleDays?: number;
  title: string;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [audit, setAudit] = useState<ProgressDailyPoint | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const summary = metricSummary(props.points, props.metric.key);
  const divisor = props.metric.divisor ?? 1;
  const stats =
    props.compare || props.metric.key === 'avgRpe' || props.daily
      ? ([
          ['average', summary.average],
          ['maximum', summary.max],
          ['minimum', summary.min],
        ] as const)
      : ([
          ['average', summary.average],
          ['maximum', summary.max],
          ['total', summary.total],
        ] as const);
  return (
    <Modal
      visible
      onClose={props.onClose}
      size="xl"
      closeLabel={t('progressDashboard.closeDetail')}
      title={t('progressDashboard.metricDetail', { metric: t(`progressDashboard.${props.metric.key}`) })}
    >
      <View style={styles.column}>
        <Text style={styles.muted}>{props.title}</Text>
        {audit ? (
          <>
            <View style={styles.between}>
              <Text style={styles.heading}>{t('progressDashboard.audit', { date: audit.date })}</Text>
              <Button
                label={t('progressDashboard.backChart')}
                onPress={() => setAudit(null)}
                variant="secondary"
                size="sm"
              />
            </View>
            <AuditData point={audit} />
          </>
        ) : (
          <>
            <MetricStats stats={stats} metric={props.metric} />
            <DashboardChart
              metric={props.metric}
              points={props.points}
              expanded
              compare={props.compare}
              connectNulls={props.connectNulls}
              cycleDays={props.cycleDays}
            />
            {selected !== null && props.points[selected] ? (
              <Text style={styles.heading}>
                {`${props.points[selected].label || props.points[selected].date}: ${formatMetric(
                  typeof props.points[selected][props.metric.key] === 'number'
                    ? Number(props.points[selected][props.metric.key]) / divisor
                    : null,
                  props.metric.unit,
                )}`}
              </Text>
            ) : null}
          </>
        )}
        <View style={styles.row}>
          {props.points.map((point, index) => (
            <Button
              key={`${point.date}-${index}`}
              label={
                props.compare
                  ? t(`progressDashboard.${props.cycleDays === 7 ? 'week' : 'cycle'}`, {
                      count: (point.cycleIndex ?? index) + 1,
                    })
                  : String(point.label || point.date)
              }
              variant={selected === index ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => {
                setSelected(index);
                if (props.daily) setAudit(props.daily.find((day) => day.date === point.date) ?? null);
              }}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function MetricStats(props: {
  stats: ReadonlyArray<readonly [string, number | null]>;
  metric: DashboardMetric;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {props.stats.map(([label, value]) => (
        <View key={label} style={[styles.panel, styles.kpi]}>
          <Text style={styles.muted}>{t(`progressDashboard.${label}`)}</Text>
          <Text style={styles.metric}>
            {formatMetric(value == null ? null : value / (props.metric.divisor ?? 1), props.metric.unit)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const auditColumns: Array<[keyof ProgressAuditSet, string]> = [
  ['sessionTitle', 'session'],
  ['setIndex', 'set'],
  ['reps', 'reps'],
  ['weightKg', 'weight'],
  ['rir', 'rir'],
  ['rpe', 'rpe'],
  ['durationSeconds', 'duration'],
  ['distanceMeters', 'distance'],
  ['heartRate', 'heartRate'],
  ['fcMaxPercent', 'fcMax'],
  ['fcReservePercent', 'fcReserve'],
  ['restSeconds', 'rest'],
  ['rom', 'rom'],
];

function AuditData({ point }: { point: ProgressDailyPoint }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.column}>
      {(point.distanceHeaders ?? []).map((header, index) => (
        <Text key={`${header.sessionId}-${index}`} style={styles.text}>
          {`${t('progressDashboard.session')} ${header.sessionId.slice(0, 8)} · ${t('progressDashboard.headerDistance')}: ${formatMetric(header.distanceMeters / 1000, 'km')}`}
        </Text>
      ))}
      <AuditTable sets={point.audit} />
    </View>
  );
}

function AuditTable({ sets }: { sets: ProgressAuditSet[] }): React.JSX.Element {
  const { t } = useTranslation();
  const visible = auditColumns.filter(
    ([key]) => ['sessionTitle', 'setIndex'].includes(key) || sets.some((s) => s[key] != null),
  );
  const cell: React.CSSProperties = { padding: space.sm, borderBottom: `1px solid ${colors.border}`, textAlign: 'left' };
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', color: colors.text }}>
        <thead>
          <tr>
            {visible.map(([key, label]) => (
              <th key={key} style={cell}>
                {t(`progressDashboard.${label}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sets.map((set, index) => (
            <tr key={`${set.sessionId}-${set.setIndex}-${index}`}>
              {visible.map(([key]) => (
                <td key={key} style={cell}>
                  {key === 'sessionTitle'
                    ? `${set.sessionTitle} · ${set.sessionId.slice(0, 8)}${set.incomplete ? ` · ${t('progressDashboard.incomplete')}` : ''}`
                    : typeof set[key] === 'string'
                      ? String(set[key])
                      : formatMetric(set[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
