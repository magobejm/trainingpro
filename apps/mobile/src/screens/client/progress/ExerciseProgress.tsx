import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  exerciseKpis,
  exerciseMetricDefs,
  type DashboardMetricDef,
  type DashboardPoint,
  type DateRange,
  type ProgressExerciseRef,
} from '@trainerpro/shared';
import { LIGHT } from '../../../theme/light';
import { ProgressPeriod } from './ProgressPeriod';
import { MetricCard, MetricDetailSheet } from './ProgressMetricViews';
import { useProgressDaily } from './use-progress-dashboard';

export function ExerciseProgress(props: {
  exercise: ProgressExerciseRef;
  range: DateRange;
  onRange: (range: DateRange) => void;
  historyFrom?: string | null;
}): React.JSX.Element {
  const { t } = useTranslation();
  const query = useProgressDaily(props.exercise, props.range);
  const [active, setActive] = useState<string[]>([]);
  const [detail, setDetail] = useState<DashboardMetricDef | null>(null);
  const data = query.data;
  const points: DashboardPoint[] = (data?.points ?? []).map((point) => ({ ...point }));
  const metrics = exerciseMetricDefs(props.exercise.exerciseType, data?.points ?? []);
  const kpis = exerciseKpis(data?.kpis, props.exercise.exerciseType, t('progressDashboard.notApplicable'));
  const toggle = (key: string) => setActive((cur) => (cur.includes(key) ? cur.filter((id) => id !== key) : [...cur, key]));
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Text style={styles.title}>{props.exercise.name}</Text>
        <Text style={styles.muted}>{t(`mobile.client.progress.group.${props.exercise.exerciseType}`)}</Text>
        <Text style={styles.muted}>{t('progressDashboard.globalScope')}</Text>
        <ProgressPeriod historyFrom={props.historyFrom} onChange={props.onRange} range={props.range} />
      </View>
      {query.isLoading ? <ActivityIndicator /> : null}
      {query.isError || (data && !data.points.length) ? (
        <Text style={styles.muted}>{t('progressDashboard.noData')}</Text>
      ) : null}
      {data ? (
        <>
          <View style={styles.row}>
            {(
              [
                ['maxWeightKg', 'maxWeight', styles.weightBox, styles.weightLabel, styles.weightValue],
                ['recordE1rm', 'estimatedPr', styles.prBox, styles.prLabel, styles.prValue],
                ['validSessions', 'times', styles.timesBox, styles.timesLabel, styles.timesValue],
              ] as const
            ).map(([key, label, box, labelStyle, valueStyle]) => (
              <View key={key} style={box}>
                <Text style={labelStyle}>{t(`mobile.client.progress.${label}`)}</Text>
                <Text style={valueStyle}>{kpis.find((kpi) => kpi.key === key)?.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.muted}>{t('progressDashboard.openMetrics')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {metrics.map((metric) => (
              <Pressable
                key={metric.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active.includes(metric.key) }}
                onPress={() => toggle(metric.key)}
                style={[styles.chip, active.includes(metric.key) && styles.chipOn]}
              >
                <Text style={[styles.chipText, active.includes(metric.key) && styles.chipTextOn]}>
                  {t(`progressDashboard.${metric.key}`)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {active.map((key) => {
            const metric = metrics.find((m) => m.key === key);
            return metric ? (
              <MetricCard
                key={key}
                metric={metric}
                onClose={() => toggle(key)}
                onDetail={() => setDetail(metric)}
                points={points}
                scope={{}}
              />
            ) : null;
          })}
        </>
      ) : null}
      {detail ? (
        <MetricDetailSheet
          daily={data?.points}
          metric={detail}
          onClose={() => setDetail(null)}
          points={points}
          scope={{}}
          title={props.exercise.name}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    padding: 14,
    width: '100%',
  },
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  chipText: { color: LIGHT.textStrong, fontSize: 12, fontWeight: '700' },
  chipTextOn: { color: '#ffffff' },
  chips: { gap: 8 },
  prBox: { backgroundColor: '#eff6ff', borderRadius: LIGHT.radiusLg, flex: 1, gap: 4, padding: 10 },
  prLabel: { color: LIGHT.accent, fontSize: 10, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  prValue: { color: LIGHT.accentDark, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  timesBox: { backgroundColor: '#ecfdf5', borderRadius: LIGHT.radiusLg, flex: 1, gap: 4, padding: 10 },
  timesLabel: { color: '#047857', fontSize: 10, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  timesValue: { color: '#065f46', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  weightBox: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusLg, flex: 1, gap: 4, padding: 10 },
  weightLabel: { color: LIGHT.textMuted, fontSize: 10, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  weightValue: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  muted: { color: LIGHT.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', gap: 8, width: '100%' },
  stack: { gap: 12, width: '100%' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
});
