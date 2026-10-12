import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button, Card, colors, fontSize, space } from '@trainerpro/ui';
import type { VariableDef } from './progress-screen.types';
export function MetricChart({
  variable,
  data,
  xKey,
  onExpand,
  t,
}: {
  variable: VariableDef;
  data: Record<string, unknown>[];
  xKey: string;
  onExpand: () => void;
  t: (k: string) => string;
}) {
  const fullSize = '100%';
  const axisZero = '0';
  const axisOne = '1';
  const gradStart = '5%';
  const gradEnd = '95%';
  const gridDash = '3 3';
  const dateKey = 'date';
  const valueKey = 'value';
  const chartType = 'monotone';
  const fillUrl = `url(#grad-${variable.id})`;
  const gridColor = colors.border;
  const chartData = data.map((pt) => ({
    date: String(pt[xKey] ?? '').slice(5),
    value: pt[variable.dataKey] ?? null,
  }));

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(variable.labelKey)}</Text>
        <Button label={t('coach.progress.chart.detailCta')} onPress={onExpand} size="sm" variant="ghost" />
      </View>
      <View style={styles.chart}>
        <ResponsiveContainer width={fullSize} height={fullSize}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${variable.id}`} x1={axisZero} y1={axisZero} x2={axisZero} y2={axisOne}>
                <stop offset={gradStart} stopColor={variable.color} stopOpacity={0.22} />
                <stop offset={gradEnd} stopColor={variable.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray={gridDash} stroke={gridColor} />
            <XAxis dataKey={dateKey} tick={{ fontSize: fontSize.xs }} />
            <YAxis tick={{ fontSize: fontSize.xs }} />
            <Tooltip
              formatter={(v) => [`${Math.round((Number(v) || 0) * 10) / 10} ${variable.unit}`, t(variable.labelKey)]}
            />
            <Area
              type={chartType}
              dataKey={valueKey}
              stroke={variable.color}
              fill={fillUrl}
              strokeWidth={2}
              dot={{ r: 3, fill: variable.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 340, minWidth: 0, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  title: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', flexShrink: 1 },
  chart: { height: 180, width: '100%' },
});
