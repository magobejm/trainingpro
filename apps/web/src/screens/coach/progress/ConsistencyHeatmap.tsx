import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, colors, fontSize, space } from '@trainerpro/ui';
import { useRecentSessionsQuery } from '../../../data/hooks/useRecentSessionsQuery';
import { buildHeatmap, heatmapRange, type HeatCell, type HeatLevel } from './heatmap';

const CELL = 12;
const GAP = 3;
const LEVEL_FILL: Record<HeatLevel, string> = {
  0: colors.surfaceMuted,
  1: `color-mix(in srgb, ${colors.primary} 30%, ${colors.surface})`,
  2: `color-mix(in srgb, ${colors.primary} 55%, ${colors.surface})`,
  3: `color-mix(in srgb, ${colors.primary} 80%, ${colors.surface})`,
  4: colors.primary,
};

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function ConsistencyHeatmap(props: { clientId: string; t: Translate }): React.JSX.Element | null {
  const range = heatmapRange(new Date());
  const query = useRecentSessionsQuery({ clientId: props.clientId, from: range.from, limit: 200, all: true, to: range.to });
  if (!query.data) return null;
  const model = buildHeatmap(query.data, new Date());
  return (
    <Card style={styles.wrap}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {props.t('coach.progress.heatmap.title')}
        </Text>
        <Text style={styles.meta}>{props.t('coach.progress.heatmap.period')}</Text>
      </View>
      <HeatGrid cells={model.weeks} t={props.t} />
      <HeatLegend t={props.t} />
      <Text style={styles.meta}>
        {props.t('coach.progress.heatmap.summary', {
          best: model.bestStreak,
          current: model.currentStreak,
          days: model.trainedDays,
        })}
      </Text>
      <Text style={styles.explanation}>{props.t('coach.progress.heatmap.criteria')}</Text>
    </Card>
  );
}

function HeatGrid(props: { cells: HeatCell[][]; t: Translate }): React.JSX.Element {
  const width = props.cells.length * (CELL + GAP);
  const height = 7 * (CELL + GAP);
  return React.createElement(
    'svg',
    {
      height,
      role: 'img',
      viewBox: `0 0 ${width} ${height}`,
      width,
      'aria-label': props.t('coach.progress.heatmap.title'),
      style: { display: 'block', maxWidth: '100%', height: 'auto' },
    },
    props.cells.map((week, column) =>
      week.map((cell, row) =>
        React.createElement(
          'rect',
          {
            fill: LEVEL_FILL[cell.level],
            stroke: cell.level === 0 ? colors.border : colors.primary,
            strokeWidth: cell.level === 0 ? 0.5 : 1,
            height: CELL,
            key: cell.date,
            rx: 2,
            width: CELL,
            x: column * (CELL + GAP),
            y: row * (CELL + GAP),
          },
          React.createElement('title', null, cellTitle(cell, props.t)),
        ),
      ),
    ),
  );
}

function HeatLegend({ t }: { t: Translate }): React.JSX.Element {
  return (
    <View style={styles.legend}>
      <View style={styles.legendGroup}>
        <HeatSwatch level={0} />
        <Text style={styles.explanation}>{t('coach.progress.heatmap.inactive')}</Text>
      </View>
      <View style={styles.legendGroup}>
        <Text style={styles.explanation}>{t('coach.progress.heatmap.less')}</Text>
        {([1, 2, 3, 4] as const).map((level) => (
          <HeatSwatch key={level} level={level} />
        ))}
        <Text style={styles.explanation}>{t('coach.progress.heatmap.more')}</Text>
      </View>
    </View>
  );
}

function HeatSwatch({ level }: { level: HeatLevel }): React.JSX.Element {
  // Use the same SVG fill as the grid: RN Web's color normalizer drops color-mix().
  return React.createElement(
    'svg',
    { width: CELL, height: CELL, 'aria-hidden': true, style: { flexShrink: 0 } },
    React.createElement('rect', {
      x: 0.5,
      y: 0.5,
      width: CELL - 1,
      height: CELL - 1,
      rx: 2,
      fill: LEVEL_FILL[level],
      stroke: level === 0 ? colors.border : colors.primary,
      strokeWidth: level === 0 ? 0.5 : 1,
    }),
  );
}

function cellTitle(cell: HeatCell, t: Translate): string {
  if (!cell.active && cell.level === 0) return t('coach.progress.heatmap.rest', { date: cell.date });
  return t('coach.progress.heatmap.cell', {
    date: cell.date,
    tonnage: cell.tonnage == null ? '—' : Math.round(cell.tonnage),
  });
}

const styles = StyleSheet.create({
  meta: { color: colors.textMuted, fontSize: fontSize.sm },
  explanation: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  wrap: { gap: space.md },
  heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  legendGroup: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
