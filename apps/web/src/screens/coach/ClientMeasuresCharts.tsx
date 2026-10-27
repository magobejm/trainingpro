import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import type { MeasureSeries } from './client-measures';

type Translate = (key: string, params?: Record<string, number | string>) => string;

const DAY = 'at';
const FULL = '100%';
const MONOTONE = 'monotone' as const;
const VALUE = 'value';
const STROKES = [colors.chartTeal, colors.chartPurple, colors.chartPink, colors.primary];

const LABELS: Record<string, string> = {
  bodyFatPct: 'coach.compare.bodyFat',
  fcMax: 'coach.measures.fcMax',
  fcRest: 'coach.measures.fcRest',
  heightCm: 'coach.clientProfile.stats.height',
  hipCm: 'coach.compare.hip',
  waistCm: 'coach.compare.waist',
  weightKg: 'coach.compare.weight',
};

/** One chart per series that has a line. */
export function MeasuresCharts(props: { series: MeasureSeries[]; t: Translate }): React.JSX.Element | null {
  if (props.series.length === 0) return null;
  return (
    <View style={styles.grid}>
      {props.series.map((item, index) => (
        <ChartCard key={item.key} series={item} stroke={STROKES[index % STROKES.length] ?? colors.chartTeal} t={props.t} />
      ))}
    </View>
  );
}

function ChartCard(props: { series: MeasureSeries; stroke: string; t: Translate }): React.JSX.Element {
  const title = seriesTitle(props.series.key, props.t);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.plot}>
        <ResponsiveContainer height={FULL} width={FULL}>
          <LineChart data={props.series.points}>
            <CartesianGrid stroke={colors.border} />
            <XAxis dataKey={DAY} tick={tickStyle} tickFormatter={formatTick} />
            <YAxis domain={chartDomain} tick={tickStyle} width={40} />
            <Tooltip labelFormatter={formatTick} />
            <Line dataKey={VALUE} dot={dotStyle} name={title} stroke={props.stroke} strokeWidth={2} type={MONOTONE} />
          </LineChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}

function seriesTitle(key: string, t: Translate): string {
  const label = LABELS[key];
  return label ? t(label) : key;
}

function chartDomain([min, max]: readonly [number, number]): [number, number] {
  const span = max - min;
  const pad = span > 0 ? span * 0.45 : Math.max(Math.abs(max) * 0.08, 1);
  return [Math.floor((min - pad) * 10) / 10, Math.ceil((max + pad) * 10) / 10];
}

function formatTick(value: unknown): string {
  const [year, month, day] = String(value ?? '').split('-');
  return year && month && day ? `${day}/${month}` : String(value ?? '');
}

const dotStyle = { r: 3, strokeWidth: 0 };
const tickStyle = { fill: colors.textMuted, fontSize: 11 };

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: 280,
    flexGrow: 1,
    gap: space.xs,
    minWidth: 240,
    padding: space.md,
  },
  cardTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  plot: { height: 168, width: '100%' },
});
