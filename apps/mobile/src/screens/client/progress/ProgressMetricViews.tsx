import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  formatMetric,
  metricSummary,
  type DashboardMetricDef,
  type DashboardPoint,
  type ProgressAuditSet,
  type ProgressDailyPoint,
} from '@trainerpro/shared';
import { colors } from '@trainerpro/ui';
import { LIGHT } from '../../../theme/light';
import { metricData, ProgressLineChart } from './ProgressLineChart';

const SLIDE = 'slide' as const;

export type MetricScope = { compare?: boolean; cycleDays?: number };

export function axisLabeler(scope: MetricScope, t: (key: string, o?: Record<string, unknown>) => string) {
  return (point: DashboardPoint, index: number): string =>
    scope.compare
      ? t(`progressDashboard.${scope.cycleDays === 7 ? 'week' : 'cycle'}`, { count: (point.cycleIndex ?? index) + 1 })
      : String(point.label || point.date);
}

export function MetricCard(props: {
  metric: DashboardMetricDef;
  points: DashboardPoint[];
  scope: MetricScope;
  onDetail: () => void;
  onClose?: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const title = t(`progressDashboard.${props.metric.key}`);
  return (
    <View style={styles.card}>
      <View style={styles.between}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: colors[props.metric.colorKey] }]} />
          <Text style={styles.heading}>{title}</Text>
        </View>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={props.onDetail} style={styles.detailBtn}>
            <Text style={styles.detailText}>{t('progressDashboard.detail')}</Text>
          </Pressable>
          {props.onClose ? (
            <Pressable
              accessibilityLabel={t('progressDashboard.closeMetric', { metric: title })}
              accessibilityRole="button"
              onPress={props.onClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>{'×'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ProgressLineChart data={metricData(props.points, props.metric, axisLabeler(props.scope, t))} metric={props.metric} />
    </View>
  );
}

export function MetricDetailSheet(props: {
  metric: DashboardMetricDef;
  points: DashboardPoint[];
  scope: MetricScope;
  daily?: ProgressDailyPoint[];
  title: string;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [audit, setAudit] = useState<ProgressDailyPoint | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const summary = metricSummary(props.points, props.metric.key);
  const divisor = props.metric.divisor ?? 1;
  const third = props.scope.compare || props.metric.key === 'avgRpe' || props.daily ? 'minimum' : 'total';
  const stats: Array<[string, number | null]> = [
    ['average', summary.average],
    ['maximum', summary.max],
    [third, third === 'minimum' ? summary.min : summary.total],
  ];
  const axis = axisLabeler(props.scope, t);
  const chosen = selected !== null ? props.points[selected] : undefined;
  const chosenRaw = chosen ? chosen[props.metric.key] : null;
  return (
    <Modal animationType={SLIDE} onRequestClose={props.onClose} visible>
      <View style={styles.sheet}>
        <View style={[styles.between, styles.sheetHead]}>
          <Text style={[styles.heading, styles.flex]}>
            {t('progressDashboard.metricDetail', { metric: t(`progressDashboard.${props.metric.key}`) })}
          </Text>
          <Pressable accessibilityLabel={t('progressDashboard.closeDetail')} onPress={props.onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{'×'}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetBody}>
          <Text style={styles.muted}>{props.title}</Text>
          {audit ? (
            <>
              <View style={styles.between}>
                <Text style={[styles.heading, styles.flex]}>{t('progressDashboard.audit', { date: audit.date })}</Text>
                <Pressable onPress={() => setAudit(null)} style={styles.detailBtn}>
                  <Text style={styles.detailText}>{t('progressDashboard.backChart')}</Text>
                </Pressable>
              </View>
              <AuditData point={audit} />
            </>
          ) : (
            <>
              <View style={styles.row}>
                {stats.map(([label, value]) => (
                  <View key={label} style={styles.kpi}>
                    <Text style={styles.muted}>{t(`progressDashboard.${label}`)}</Text>
                    <Text style={styles.kpiValue}>
                      {formatMetric(value == null ? null : value / divisor, props.metric.unit)}
                    </Text>
                  </View>
                ))}
              </View>
              <ProgressLineChart data={metricData(props.points, props.metric, axis)} height={280} metric={props.metric} />
              {chosen ? (
                <Text style={styles.heading}>
                  {`${chosen.label || chosen.date}: ${formatMetric(
                    typeof chosenRaw === 'number' ? chosenRaw / divisor : null,
                    props.metric.unit,
                  )}`}
                </Text>
              ) : null}
            </>
          )}
          <View style={styles.wrapRow}>
            {props.points.map((point, index) => (
              <Pressable
                key={`${point.date}-${index}`}
                onPress={() => {
                  setSelected(index);
                  if (props.daily) setAudit(props.daily.find((day) => day.date === point.date) ?? null);
                }}
                style={[styles.chip, selected === index && styles.chipOn]}
              >
                <Text style={[styles.chipText, selected === index && styles.chipTextOn]}>{axis(point, index)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
  const sets = point.audit;
  const visible = auditColumns.filter(
    ([key]) => ['sessionTitle', 'setIndex'].includes(key) || sets.some((s) => s[key as keyof ProgressAuditSet] != null),
  );
  return (
    <View style={styles.auditWrap}>
      {(point.distanceHeaders ?? []).map((header, index) => (
        <Text key={`${header.sessionId}-${index}`} style={styles.muted}>
          {`${t('progressDashboard.session')} ${header.sessionId.slice(0, 8)} · ${t('progressDashboard.headerDistance')}: ${formatMetric(header.distanceMeters / 1000, 'km')}`}
        </Text>
      ))}
      <ScrollView horizontal>
        <View>
          <View style={styles.auditRow}>
            {visible.map(([key, label]) => (
              <Text key={key} style={[styles.auditCell, styles.auditHead, key === 'sessionTitle' && styles.auditWide]}>
                {t(`progressDashboard.${label}`)}
              </Text>
            ))}
          </View>
          {sets.map((set, index) => (
            <View key={`${set.sessionId}-${set.setIndex}-${index}`} style={styles.auditRow}>
              {visible.map(([key]) => (
                <Text key={key} style={[styles.auditCell, key === 'sessionTitle' && styles.auditWide]}>
                  {key === 'sessionTitle'
                    ? `${set.sessionTitle}${set.incomplete ? ` · ${t('progressDashboard.incomplete')}` : ''}`
                    : typeof set[key] === 'string'
                      ? String(set[key])
                      : formatMetric(set[key])}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  auditCell: { color: LIGHT.textStrong, fontSize: 12, paddingHorizontal: 6, paddingVertical: 6, width: 72 },
  auditHead: { color: LIGHT.textMuted, fontWeight: '800' },
  auditRow: { borderBottomColor: LIGHT.border, borderBottomWidth: 1, flexDirection: 'row' },
  auditWide: { width: 150 },
  auditWrap: { gap: 8, width: '100%' },
  between: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  chipText: { color: LIGHT.textStrong, fontSize: 12, fontWeight: '700' },
  chipTextOn: { color: '#ffffff' },
  closeBtn: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  closeText: { color: LIGHT.textMuted, fontSize: 22, fontWeight: '700' },
  detailBtn: { backgroundColor: LIGHT.accentSoft, borderRadius: LIGHT.radiusMd, paddingHorizontal: 12, paddingVertical: 6 },
  detailText: { color: LIGHT.accent, fontSize: 12, fontWeight: '800' },
  dot: { borderRadius: 5, height: 10, width: 10 },
  flex: { flex: 1 },
  heading: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  kpi: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusMd, flex: 1, gap: 2, minWidth: 90, padding: 10 },
  kpiValue: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800' },
  muted: { color: LIGHT.textMuted, fontSize: 12 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  sheet: { backgroundColor: LIGHT.bgSoft, flex: 1, paddingTop: 48 },
  sheetHead: { paddingHorizontal: 16 },
  sheetBody: { gap: 12, padding: 16, paddingBottom: 48 },
  titleRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
