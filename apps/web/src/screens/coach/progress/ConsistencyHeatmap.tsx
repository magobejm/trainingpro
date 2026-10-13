import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';
import { useRecentSessionsQuery } from '../../../data/hooks/useRecentSessionsQuery';
import { buildHeatmap, heatmapRange, type HeatCell, type HeatLevel } from './heatmap';

const CELL = 12;
const GAP = 3;
const LEVEL_FILL: Record<HeatLevel, string> = {
  0: colors.border,
  1: colors.primarySoft,
  2: colors.primaryBorder,
  3: colors.primary,
  4: colors.primaryHover,
};

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function ConsistencyHeatmap(props: { clientId: string; t: Translate }): React.JSX.Element | null {
  const range = heatmapRange(new Date());
  const query = useRecentSessionsQuery({ clientId: props.clientId, from: range.from, limit: 200, to: range.to });
  if (!query.data) return null;
  const model = buildHeatmap(query.data, new Date());
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{props.t('coach.progress.heatmap.title')}</Text>
      <HeatGrid cells={model.weeks} t={props.t} />
      <Text style={styles.meta}>
        {props.t('coach.progress.heatmap.summary', {
          best: model.bestStreak,
          current: model.currentStreak,
          days: model.trainedDays,
        })}
      </Text>
    </View>
  );
}

function HeatGrid(props: { cells: HeatCell[][]; t: Translate }): React.JSX.Element {
  const width = props.cells.length * (CELL + GAP);
  const height = 7 * (CELL + GAP);
  return React.createElement(
    'svg',
    { height, role: 'img', viewBox: `0 0 ${width} ${height}`, width },
    props.cells.map((week, column) =>
      week.map((cell, row) =>
        React.createElement(
          'rect',
          {
            fill: LEVEL_FILL[cell.level],
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

function cellTitle(cell: HeatCell, t: Translate): string {
  if (cell.tonnage <= 0) return t('coach.progress.heatmap.rest', { date: cell.date });
  return t('coach.progress.heatmap.cell', { date: cell.date, tonnage: Math.round(cell.tonnage) });
}

const styles = StyleSheet.create({
  meta: { color: colors.textMuted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  wrap: { gap: space.sm },
});
