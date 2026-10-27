import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import {
  markEvolution,
  measureEvolution,
  type CompareMark,
  type CompareMeasure,
  type ComparisonRow,
  type MeasureKey,
  type SeriesPoint,
} from './progress/comparison';

type Translate = (key: string) => string;
type ChartCard = { key: string; points: SeriesPoint[]; stroke: string; summary: string; title: string };

const DAY = 'day';
const VALUE = 'value';
const MONOTONE = 'monotone' as const;
const FULL = '100%';
const STROKES = [colors.chartTeal, colors.chartPurple, colors.chartPink, colors.primary] as const;
const MEASURE_LABELS: Record<string, string> = {
  bodyFatPct: 'coach.compare.bodyFat',
  hipCm: 'coach.compare.hip',
  waistCm: 'coach.compare.waist',
  weightKg: 'coach.compare.weight',
};
const tickStyle = { fill: colors.textMuted, fontSize: fontSize.xs };

export function CompareEvolution(props: {
  leftDate: string;
  marks: CompareMark[];
  measureRows: ComparisonRow[];
  measures: CompareMeasure[];
  rightDate: string;
  t: Translate;
  testRows: ComparisonRow[];
}): React.JSX.Element {
  return (
    <View style={styles.sections}>
      <CompareBlock cards={measureCards(props)} title={props.t('coach.compare.measures')} />
      <CompareBlock cards={testCards(props)} title={props.t('coach.compare.tests')} />
    </View>
  );
}

function CompareBlock(props: { cards: ChartCard[]; title: string }): React.JSX.Element | null {
  if (props.cards.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{props.title}</Text>
      <View style={styles.grid}>
        {props.cards.map((card) => (
          <ChartCardView card={card} key={card.key} />
        ))}
      </View>
    </View>
  );
}

function ChartCardView(props: { card: ChartCard }): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{props.card.title}</Text>
      <Text style={styles.summary}>{props.card.summary}</Text>
      <Trend chart={props.card} />
    </View>
  );
}

function Trend(props: { chart: ChartCard }): React.JSX.Element | null {
  if (props.chart.points.length < 2) return null;
  return (
    <View style={styles.plot}>
      <ResponsiveContainer height={FULL} width={FULL}>
        <LineChart data={props.chart.points}>
          <CartesianGrid stroke={colors.border} />
          <XAxis dataKey={DAY} tick={tickStyle} tickFormatter={formatTick} />
          <YAxis domain={chartDomain} tick={tickStyle} width={40} />
          <Tooltip labelFormatter={formatTick} />
          <Line
            dataKey={VALUE}
            dot={dotStyle}
            name={props.chart.title}
            stroke={props.chart.stroke}
            strokeWidth={2}
            type={MONOTONE}
          />
        </LineChart>
      </ResponsiveContainer>
    </View>
  );
}

function measureCards(props: {
  leftDate: string;
  measureRows: ComparisonRow[];
  measures: CompareMeasure[];
  rightDate: string;
  t: Translate;
}): ChartCard[] {
  return props.measureRows.map((row, index) => ({
    key: row.name,
    points: isMeasureKey(row.name) ? measureEvolution(props.measures, row.name, props.leftDate, props.rightDate) : [],
    stroke: strokeAt(index),
    summary: summaryOf(row),
    title: props.t(MEASURE_LABELS[row.name] ?? row.name),
  }));
}

function testCards(props: {
  leftDate: string;
  marks: CompareMark[];
  rightDate: string;
  testRows: ComparisonRow[];
}): ChartCard[] {
  return props.testRows.map((row, index) => ({
    key: row.name,
    points: markEvolution(props.marks, row.name, props.leftDate, props.rightDate),
    stroke: strokeAt(index),
    summary: summaryOf(row),
    title: row.name,
  }));
}

function summaryOf(row: ComparisonRow): string {
  return `${row.before} → ${row.after} (${row.delta})`;
}

function strokeAt(index: number): string {
  return STROKES[index % STROKES.length] ?? colors.chartTeal;
}

function isMeasureKey(name: string): name is MeasureKey {
  return Object.prototype.hasOwnProperty.call(MEASURE_LABELS, name);
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
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  plot: { height: 168, width: '100%' },
  section: { gap: space.sm },
  sections: { gap: space.lg },
  summary: { color: colors.textMuted, fontSize: fontSize.sm },
});
