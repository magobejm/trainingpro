import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildWellnessTrend, type WellnessTrendRange } from '@trainerpro/shared';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import '../../i18n';
import type { ClientWellnessCheckin, ClientWellnessSession } from '../../data/hooks/useClientWellness';

type SeriesKey = 'motivation' | 'recovery' | 'sleep';
type Active = 'all' | SeriesKey;
type Row = {
  date: string;
  label: string;
  motivation: null | number;
  recovery: null | number;
  rpe: null | number;
  rpeScaled: null | number;
  sleep: null | number;
  trained: boolean;
};

type Props = { checkins: ClientWellnessCheckin[]; endDate: string; sessions: ClientWellnessSession[] };

const SERIES: readonly SeriesKey[] = ['sleep', 'motivation', 'recovery'];
const RANGES: WellnessTrendRange[] = [7, 30];
const SERIES_COLORS: Record<SeriesKey, string> = {
  motivation: colors.primary,
  recovery: colors.chartPurple,
  sleep: colors.chartTeal,
};
const Y_TICKS = [1, 2, 3, 4, 5];
const Y_DOMAIN: [number, number] = [1, 5];
const FULL = '100%';
const LINEAR = 'linear' as const;
const tickStyle = { fill: colors.textMuted, fontSize: 11 };
const dotStyle = (fill: string) => ({ fill, r: 3.5, strokeWidth: 0 });

export function ClientMoodTrendChart(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [range, setRange] = useState<WellnessTrendRange>(7);
  const [active, setActive] = useState<Active>('all');
  const rows = useMemo<Row[]>(
    () =>
      buildWellnessTrend({ checkins: props.checkins, endDate: props.endDate, range, sessions: props.sessions }).map((p) => ({
        ...p,
        label: `${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`,
      })),
    [props.checkins, props.endDate, props.sessions, range],
  );
  const visible = active === 'all' ? SERIES : [active];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('coach.mood.chart.title')}</Text>
        <View style={styles.pills}>
          {RANGES.map((value) => (
            <Pill
              key={value}
              label={t(`coach.mood.chart.range${value}`)}
              on={range === value}
              onPress={() => setRange(value)}
            />
          ))}
        </View>
      </View>
      <View style={styles.pills}>
        <Pill label={t('coach.mood.chart.compareAll')} on={active === 'all'} onPress={() => setActive('all')} />
        {SERIES.map((key) => (
          <Pill
            color={SERIES_COLORS[key]}
            key={key}
            label={t(`coach.mood.chart.series.${key}`)}
            on={active === key}
            onPress={() => setActive(key)}
          />
        ))}
      </View>
      <View style={styles.plot}>
        <ResponsiveContainer height={FULL} width={FULL}>
          <ComposedChart data={rows} margin={{ bottom: 4, left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke={colors.border} strokeDasharray={'3 4'} vertical={false} />
            {rows
              .filter((row) => row.trained)
              .map((row) => (
                <ReferenceArea fill={colors.primarySoft} fillOpacity={0.9} key={row.date} x1={row.label} x2={row.label} />
              ))}
            <XAxis dataKey={'label'} interval={range === 7 ? 0 : 4} tick={tickStyle} />
            <YAxis allowDataOverflow domain={Y_DOMAIN} tick={tickStyle} ticks={Y_TICKS} width={28} />
            <Tooltip content={<MoodTooltip />} />
            <Bar barSize={18} dataKey={'rpeScaled'} fill={colors.warning} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
            {visible.map((key) => (
              <Line
                connectNulls={false}
                dataKey={key}
                dot={dotStyle(SERIES_COLORS[key])}
                key={key}
                stroke={SERIES_COLORS[key]}
                strokeWidth={2.5}
                type={LINEAR}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{t('coach.mood.chart.rpeLegend')}</Text>
        <Text style={styles.legendText}>{t('coach.mood.chart.trainedLegend')}</Text>
        <Text style={styles.legendText}>{t('coach.mood.chart.axis')}</Text>
      </View>
    </View>
  );
}

type TooltipInput = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> };

function MoodTooltip(props: TooltipInput): React.JSX.Element | null {
  const { t } = useTranslation();
  const row = props.payload?.[0]?.payload as Row | undefined;
  if (!props.active || !row) return null;
  const dash = '–';
  return (
    <View style={styles.tooltip}>
      <Text style={styles.tooltipTitle}>
        {`${row.date} · ${t(row.trained ? 'coach.mood.chart.trained' : 'coach.mood.chart.rest')}`}
      </Text>
      {SERIES.map((key) => (
        <Text key={key} style={styles.tooltipLine}>{`${t(`coach.mood.chart.series.${key}`)}: ${row[key] ?? dash}`}</Text>
      ))}
      <Text style={styles.tooltipLine}>
        {`${t('coach.mood.chart.rpeReal')}: ${row.rpe === null ? dash : `${row.rpe}/10`}`}
      </Text>
    </View>
  );
}

function Pill(props: { color?: string; label: string; on: boolean; onPress: () => void }): React.JSX.Element {
  const tint = props.color ?? colors.primary;
  return (
    <Pressable
      accessibilityRole={'button'}
      onPress={props.onPress}
      style={[styles.pill, props.on ? { backgroundColor: tint, borderColor: tint } : null]}
    >
      <Text style={[styles.pillText, props.on ? styles.pillTextOn : null]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'space-between',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  legendText: { color: colors.textMuted, fontSize: fontSize.xs },
  pill: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  pillText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
  pillTextOn: { color: colors.surface },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  plot: { height: 260, width: '100%' },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  tooltip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    padding: space.sm,
  },
  tooltipLine: { color: colors.text, fontSize: fontSize.xs },
  tooltipTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
});
