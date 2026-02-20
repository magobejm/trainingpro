import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type BarsChartPoint = {
  id: string;
  label: string;
  value: number;
};

type Props = {
  bars: BarsChartPoint[];
  emptyLabel: string;
  maxHeight?: number;
  title: string;
};

const COLORS = {
  axis: '#d5deea',
  bar: '#2a7fff',
  card: '#ffffff',
  label: '#55667c',
  text: '#0f1b2f',
};

export function BarsChart(props: Props): React.JSX.Element {
  if (props.bars.length === 0) {
    return <EmptyChart title={props.title} emptyLabel={props.emptyLabel} />;
  }
  return <ChartBody {...props} maxHeight={props.maxHeight ?? 120} />;
}

function EmptyChart(props: { emptyLabel: string; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.empty}>{props.emptyLabel}</Text>
    </View>
  );
}

function ChartBody(props: Props & { maxHeight: number }) {
  const maxValue = readMaxValue(props.bars);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{props.title}</Text>
      <View style={[styles.chartArea, { height: props.maxHeight + 24 }]}>
        {props.bars.map((item) => (
          <View key={item.id} style={styles.barItem}>
            <Text style={styles.value}>{formatValue(item.value)}</Text>
            <View
              style={[styles.bar, { height: readBarHeight(item.value, maxValue, props.maxHeight) }]}
            />
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function readBarHeight(value: number, maxValue: number, maxHeight: number): number {
  if (maxValue <= 0) {
    return 4;
  }
  const normalized = Math.max(0, value) / maxValue;
  return Math.max(4, Math.round(normalized * maxHeight));
}

function readMaxValue(bars: BarsChartPoint[]): number {
  return bars.reduce((max, item) => Math.max(max, item.value), 0);
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.bar,
    borderRadius: 8,
    minWidth: 26,
    width: '100%',
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    justifyContent: 'flex-end',
    minWidth: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.axis,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  chartArea: {
    alignItems: 'flex-end',
    borderTopColor: COLORS.axis,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  empty: {
    color: COLORS.label,
    fontSize: 13,
  },
  label: {
    color: COLORS.label,
    fontSize: 11,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  value: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
