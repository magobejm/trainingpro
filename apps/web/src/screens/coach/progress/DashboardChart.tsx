import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, colors, fontSize } from '@trainerpro/ui';
import type { ProgressExerciseType, ProgressDailyPoint } from '@trainerpro/shared';
import { dashboardStyles as styles } from './dashboard.styles';
import { formatMetric, type DashboardPoint } from './dashboard-model';

export type DashboardMetric = { key: string; unit: string; color: string; divisor?: number };
const metric = (key: string, unit: string, color: string, divisor?: number): DashboardMetric => ({
  key,
  unit,
  color,
  divisor,
});
export const routineMetrics = [
  metric('tonnage', 'kg', colors.chartPurple),
  metric('avgRpe', '', colors.danger),
  metric('trainingLoad', 'u.a.', colors.primary),
];
const sets = metric('sets', '', colors.success);
const reps = metric('totalReps', '', colors.info);
const rpe = routineMetrics[1]!;
const time = metric('totalDurationSeconds', 'min', colors.primary, 60);
const cardio = [
  sets,
  time,
  metric('avgHeartRate', 'ppm', colors.chartPink),
  rpe,
  metric('avgPaceMinKm', 'min/km', colors.chartTeal),
  metric('fcReservePercent', '%', colors.warning),
];
const strength = [
  sets,
  reps,
  routineMetrics[0]!,
  rpe,
  metric('inol', '', colors.warning),
  metric('e1rm', 'kg', colors.primary),
];

export function exerciseMetrics(type: ProgressExerciseType, points: ProgressDailyPoint[]): DashboardMetric[] {
  if (type === 'strength') return strength;
  if (type === 'cardio') return cardio;
  if (type === 'plio') return [sets, reps, routineMetrics[0]!, rpe];
  if (type === 'isometric') return [sets, { ...time, unit: 's', divisor: 1 }, routineMetrics[0]!, rpe];
  if (type === 'mobility') return [sets, reps, rpe];
  const available = [
    ...strength,
    time,
    ...cardio.filter((m) => !['sets', 'totalDurationSeconds', 'avgRpe'].includes(m.key)),
    metric('distanceMeters', 'km', colors.info, 1000),
  ];
  return available.filter((m) => m.key === 'sets' || points.some((p) => p[m.key as keyof ProgressDailyPoint] != null));
}

export function DashboardChart(props: {
  metric: DashboardMetric;
  points: DashboardPoint[];
  compare?: boolean;
  cycleDays?: number;
  expanded?: boolean;
  onDetail?: () => void;
  onClose?: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const title = t(`progressDashboard.${props.metric.key}`);
  return (
    <View style={[styles.panel, props.expanded ? null : styles.chart]}>
      <View style={styles.between}>
        <Text style={styles.heading}>{title}</Text>
        <View style={styles.row}>
          {props.onDetail ? (
            <Button label={t('progressDashboard.detail')} onPress={props.onDetail} size="sm" variant="ghost" />
          ) : null}
          {props.onClose ? (
            <Button
              label={'×'}
              accessibilityLabel={t('progressDashboard.closeMetric', { metric: title })}
              onPress={props.onClose}
              size="sm"
              variant="ghost"
            />
          ) : null}
        </View>
      </View>
      <DashboardPlot {...props} />
      {props.points.length > 8 ? <Text style={styles.muted}>{t('progressDashboard.scrollHint')}</Text> : null}
    </View>
  );
}

function DashboardPlot(props: {
  metric: DashboardMetric;
  points: DashboardPoint[];
  compare?: boolean;
  cycleDays?: number;
  expanded?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const data = props.points.map((point, index) => ({
    ...point,
    value:
      typeof point[props.metric.key] === 'number' ? Number(point[props.metric.key]) / (props.metric.divisor ?? 1) : null,
    axis: props.compare
      ? t(`progressDashboard.${props.cycleDays === 7 ? 'week' : 'cycle'}`, { count: (point.cycleIndex ?? index) + 1 })
      : point.label || point.date,
  }));
  const gradient = `dashboard-${props.metric.key}-${props.expanded ? 'detail' : 'card'}`;
  return (
    <div style={{ width: '100%', overflowX: 'auto' }} tabIndex={0} aria-label={t('progressDashboard.scrollHint')}>
      <div style={{ width: '100%', minWidth: Math.max(280, data.length * 58), height: props.expanded ? 300 : 210 }}>
        <ResponsiveContainer
          width={'100%'}
          height={'100%'}
          initialDimension={{ width: Math.max(280, data.length * 58), height: props.expanded ? 300 : 210 }}
        >
          <AreaChart data={data} margin={{ left: 0, right: 20, top: 15, bottom: 10 }}>
            <defs>
              <linearGradient id={gradient} x1={'0'} y1={'0'} x2={'0'} y2={'1'}>
                <stop offset={'0%'} stopColor={props.metric.color} stopOpacity={0.22} />
                <stop offset={'100%'} stopColor={props.metric.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={colors.border} strokeDasharray={'3 3'} vertical={false} />
            <XAxis dataKey={'axis'} interval={0} tick={{ fontSize: fontSize.xs, fill: colors.textMuted }} />
            <YAxis tick={{ fontSize: fontSize.xs, fill: colors.textMuted }} width={56} />
            <Tooltip
              contentStyle={{ backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }}
              formatter={(value) => formatMetric(value, props.metric.unit)}
            />
            <Area
              dataKey={'value'}
              type={'linear'}
              stroke={props.metric.color}
              fill={`url(#${gradient})`}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
