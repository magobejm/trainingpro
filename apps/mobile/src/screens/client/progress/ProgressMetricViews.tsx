import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  formatMetric,
  metricTrend,
  type DashboardMetricDef,
  type DashboardPoint,
  type ProgressAuditSet,
  type ProgressDailyPoint,
  type TrendDirection,
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

function seriesValues(points: DashboardPoint[], metric: DashboardMetricDef): Array<number | null> {
  const divisor = metric.divisor ?? 1;
  return points.map((point) => {
    const raw = point[metric.key];
    return typeof raw === 'number' && Number.isFinite(raw) ? raw / divisor : null;
  });
}

function axisWord(scope: MetricScope, t: (key: string) => string): string {
  if (scope.compare && scope.cycleDays === 7) return t('progressDashboard.weeks');
  if (scope.compare) return t('progressDashboard.microcycles');
  if (scope.cycleDays) return t('progressDashboard.sessionsUnit');
  return t('progressDashboard.daysUnit');
}

function trendColor(direction: TrendDirection): string {
  if (direction === 'up') return LIGHT.success;
  if (direction === 'down') return LIGHT.error;
  return LIGHT.textMuted;
}

function trendGlyph(direction: TrendDirection): string {
  if (direction === 'up') return '↗';
  if (direction === 'down') return '↘';
  return '–';
}

function formatDelta(diff: number): string {
  if (diff === 0) return '=';
  const text = formatMetric(Math.abs(diff));
  return diff > 0 ? `+${text}` : `−${text}`;
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
  const labelOf = axisLabeler(props.scope, t);
  const labels = props.points.map((point, index) => labelOf(point, index));
  const values = seriesValues(props.points, props.metric);
  const trend = metricTrend(values);
  const metricName = t(`progressDashboard.${props.metric.key}`);
  const axis = axisWord(props.scope, t);
  const yLabel = props.metric.unit ? `${metricName} (${props.metric.unit})` : metricName;
  const openAudit = (index: number) => {
    const date = props.points[index]?.date;
    setAudit(props.daily?.find((day) => day.date === date) ?? null);
  };
  return (
    <Modal animationType={SLIDE} onRequestClose={props.onClose} transparent visible>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={[styles.between, styles.dialogHead]}>
            <View style={[styles.titleRow, styles.flex]}>
              <View style={[styles.dot, { backgroundColor: colors[props.metric.colorKey] }]} />
              <Text style={styles.heading}>{t('progressDashboard.detailTrend', { metric: metricName })}</Text>
            </View>
            <Pressable
              accessibilityLabel={t('progressDashboard.closeDetail')}
              onPress={props.onClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>{'×'}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.dialogBody}>
            <Text style={styles.muted}>
              {t('progressDashboard.scopeCount', { axis, count: props.points.length, name: props.title })}
            </Text>
            <TrendKpis trend={trend} unit={props.metric.unit} />
            <TrendChart
              axis={axis}
              metric={props.metric}
              points={props.points}
              scope={props.scope}
              trend={trend.line}
              yLabel={yLabel}
            />
            {audit ? (
              <AuditPanel onBack={() => setAudit(null)} point={audit} />
            ) : (
              <Chronology
                axis={axis}
                hint={Boolean(props.daily)}
                labels={labels}
                onPress={props.daily ? openAudit : undefined}
                unit={props.metric.unit}
                values={values}
              />
            )}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={props.onClose} style={styles.closeAction}>
            <Text style={styles.closeActionText}>{t('progressDashboard.closeDetail')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function TrendKpis(props: { trend: ReturnType<typeof metricTrend>; unit: string }): React.JSX.Element {
  const { t } = useTranslation();
  const color = trendColor(props.trend.direction);
  const boxes: Array<{ key: string; label: string; value: string; trend?: boolean }> = [
    { key: 'current', label: t('progressDashboard.currentValue'), value: formatMetric(props.trend.current, props.unit) },
    { key: 'average', label: t('progressDashboard.average'), value: formatMetric(props.trend.average, props.unit) },
    {
      key: 'trend',
      label: t('progressDashboard.trend'),
      trend: true,
      value: `${trendGlyph(props.trend.direction)} ${props.trend.percent >= 0 ? '+' : ''}${props.trend.percent}%`,
    },
  ];
  return (
    <View style={styles.kpiRow}>
      {boxes.map((box) => (
        <View key={box.key} style={[styles.kpi, box.trend && styles.kpiTrend]}>
          <Text style={[styles.kpiLabel, box.trend && styles.kpiTrendLabel]}>{box.label}</Text>
          <Text style={[styles.kpiValue, box.trend && { color }]}>{box.value}</Text>
        </View>
      ))}
    </View>
  );
}

function TrendChart(props: {
  metric: DashboardMetricDef;
  points: DashboardPoint[];
  scope: MetricScope;
  trend: Array<number | null>;
  yLabel: string;
  axis: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const data = metricData(props.points, props.metric, axisLabeler(props.scope, t));
  return (
    <View style={styles.chartCard}>
      <View style={styles.between}>
        <View style={styles.row}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors[props.metric.colorKey] }]} />
            <Text style={styles.legendText}>{t('progressDashboard.realData')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.trendSwatch} />
            <Text style={styles.trendLegend}>{t('progressDashboard.trend')}</Text>
          </View>
        </View>
        <Text style={styles.axisCaption}>{t('progressDashboard.versus', { axis: props.axis, metric: props.yLabel })}</Text>
      </View>
      <ProgressLineChart
        data={data}
        height={220}
        metric={props.metric}
        showValues={data.length > 0 && data.length <= 10}
        trend={props.trend}
      />
    </View>
  );
}

function Chronology(props: {
  axis: string;
  labels: string[];
  values: Array<number | null>;
  unit: string;
  hint: boolean;
  onPress?: (index: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.block}>
      <Text style={styles.chronoTitle}>{t('progressDashboard.chronology', { axis: props.axis })}</Text>
      {props.hint ? <Text style={styles.muted}>{t('progressDashboard.auditHint')}</Text> : null}
      <View style={styles.chronoList}>
        {props.labels.map((label, index) => (
          <ChronologyRow
            key={`${label}-${index}`}
            index={index}
            label={label}
            onPress={props.onPress ? () => props.onPress?.(index) : undefined}
            previous={index > 0 ? (props.values[index - 1] ?? null) : null}
            unit={props.unit}
            value={props.values[index] ?? null}
          />
        ))}
      </View>
    </View>
  );
}

function ChronologyRow(props: {
  index: number;
  label: string;
  value: number | null;
  previous: number | null;
  unit: string;
  onPress?: () => void;
}): React.JSX.Element {
  const delta = props.value != null && props.previous != null ? props.value - props.previous : null;
  return (
    <Pressable accessibilityRole="button" disabled={!props.onPress} onPress={props.onPress} style={styles.chronoRow}>
      <View style={[styles.row, styles.flex]}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{props.index + 1}</Text>
        </View>
        <Text style={styles.chronoLabel}>{props.label}</Text>
      </View>
      <View style={styles.row}>
        {delta == null ? null : <Text style={[styles.delta, deltaLook(delta)]}>{formatDelta(delta)}</Text>}
        <Text style={styles.chronoValue}>{formatMetric(props.value, props.unit)}</Text>
      </View>
    </Pressable>
  );
}

function deltaLook(diff: number): { backgroundColor: string; color: string } {
  if (diff > 0) return { backgroundColor: LIGHT.emeraldSoft, color: '#047857' };
  if (diff < 0) return { backgroundColor: LIGHT.redSoft, color: LIGHT.error };
  return { backgroundColor: '#f1f5f9', color: LIGHT.textMuted };
}

function AuditPanel(props: { point: ProgressDailyPoint; onBack: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.block}>
      <View style={styles.between}>
        <Text style={[styles.heading, styles.flex]}>{t('progressDashboard.audit', { date: props.point.date })}</Text>
        <Pressable onPress={props.onBack} style={styles.detailBtn}>
          <Text style={styles.detailText}>{t('progressDashboard.backRegister')}</Text>
        </Pressable>
      </View>
      <AuditData point={props.point} />
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
  axisCaption: { color: LIGHT.textMuted, flexShrink: 1, fontSize: 10, fontStyle: 'italic', textAlign: 'right' },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  block: { gap: 8 },
  chartCard: { borderColor: '#e2e8f0', borderRadius: 24, borderWidth: 1, gap: 8, padding: 12 },
  chronoLabel: { color: LIGHT.textStrong, flex: 1, fontSize: 12, fontWeight: '800' },
  chronoList: { borderColor: '#e2e8f0', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  chronoRow: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chronoTitle: { color: LIGHT.textStrong, fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  chronoValue: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '800' },
  closeAction: { backgroundColor: LIGHT.accent, borderRadius: 12, margin: 14, paddingVertical: 12 },
  closeActionText: { color: '#ffffff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  closeBtn: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  closeText: { color: LIGHT.textMuted, fontSize: 22, fontWeight: '700' },
  delta: { borderRadius: 6, fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 2 },
  detailBtn: { backgroundColor: LIGHT.accentSoft, borderRadius: LIGHT.radiusMd, paddingHorizontal: 12, paddingVertical: 6 },
  detailText: { color: LIGHT.accent, fontSize: 12, fontWeight: '800' },
  dialog: { backgroundColor: '#ffffff', borderRadius: 24, maxHeight: '92%', overflow: 'hidden', width: '100%' },
  dialogBody: { gap: 14, padding: 16 },
  dialogHead: { borderBottomColor: '#e2e8f0', borderBottomWidth: 1, padding: 16 },
  dot: { borderRadius: 5, height: 10, width: 10 },
  flex: { flex: 1 },
  heading: { color: LIGHT.textStrong, flexShrink: 1, fontSize: 15, fontWeight: '800' },
  indexBadge: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  indexText: { color: LIGHT.textMuted, fontSize: 10, fontWeight: '800' },
  kpi: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  kpiLabel: { color: LIGHT.textMuted, fontSize: 9, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiTrend: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  kpiTrendLabel: { color: LIGHT.accent },
  kpiValue: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  legendText: { color: LIGHT.textStrong, fontSize: 11, fontWeight: '800' },
  muted: { color: LIGHT.textMuted, fontSize: 12 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  titleRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 },
  trendLegend: { color: '#d97706', fontSize: 11, fontWeight: '800' },
  trendSwatch: { borderColor: '#f59e0b', borderStyle: 'dashed', borderTopWidth: 2, height: 2, width: 14 },
});
