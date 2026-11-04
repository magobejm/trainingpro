/* eslint-disable no-restricted-syntax -- SVG geometry attributes are not user-facing text. */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '@trainerpro/ui';
import type { DashboardMetricDef, DashboardPoint } from '@trainerpro/shared';
import { LIGHT } from '../../../theme/light';

const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;
const STEP = 58;

export type ChartDatum = { axis: string; value: number | null };

export function metricData(
  points: DashboardPoint[],
  metric: DashboardMetricDef,
  axisOf: (point: DashboardPoint, index: number) => string,
): ChartDatum[] {
  return points.map((point, index) => {
    const raw = point[metric.key];
    return {
      axis: axisOf(point, index),
      value: typeof raw === 'number' && Number.isFinite(raw) ? raw / (metric.divisor ?? 1) : null,
    };
  });
}

function fmt(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

export function ProgressLineChart(props: {
  data: ChartDatum[];
  metric: DashboardMetricDef;
  height?: number;
}): React.JSX.Element {
  const [width, setWidth] = useState(300);
  const height = props.height ?? 200;
  const color = colors[props.metric.colorKey];
  const innerWidth = Math.max(width, PAD_LEFT + PAD_RIGHT + props.data.length * STEP);
  const values = props.data.flatMap((d) => (d.value === null ? [] : [d.value]));
  const max = values.length ? Math.max(...values) : 1;
  const min = values.length ? Math.min(...values) : 0;
  const low = Math.min(0, min);
  const span = max - low || 1;
  const plotW = innerWidth - PAD_LEFT - PAD_RIGHT;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_LEFT + (props.data.length > 1 ? (i / (props.data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD_TOP + plotH - ((v - low) / span) * plotH;
  const present = props.data.flatMap((d, i) => (d.value === null ? [] : [{ i, v: d.value }]));
  const line = present.map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.i)} ${y(p.v)}`).join(' ');
  const base = PAD_TOP + plotH;
  const area =
    present.length > 1 ? `${line} L ${x(present[present.length - 1]!.i)} ${base} L ${x(present[0]!.i)} ${base} Z` : '';
  const grid = [max, (max + low) / 2, low];
  const gradId = `grad-${props.metric.key}`;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg height={height} width={innerWidth}>
          <Defs>
            <LinearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.25} />
              <Stop offset="1" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {grid.map((g, k) => (
            <React.Fragment key={k}>
              <Line
                stroke={LIGHT.borderStrong}
                strokeDasharray="3 3"
                x1={PAD_LEFT - 4}
                x2={innerWidth - PAD_RIGHT}
                y1={y(g)}
                y2={y(g)}
              />
              <SvgText fill={LIGHT.textMuted} fontSize={10} textAnchor="end" x={PAD_LEFT - 8} y={y(g) + 3}>
                {fmt(g)}
              </SvgText>
            </React.Fragment>
          ))}
          {area ? <Path d={area} fill={`url(#${gradId})`} /> : null}
          {line ? (
            <Path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
          ) : null}
          {present.map((p) => (
            <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} fill="#ffffff" r={3.5} stroke={color} strokeWidth={2} />
          ))}
          {props.data.map((d, i) => (
            <SvgText key={i} fill={LIGHT.textMuted} fontSize={9} textAnchor="middle" x={x(i)} y={height - 8}>
              {d.axis.length > 10 ? d.axis.slice(5) : d.axis}
            </SvgText>
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
