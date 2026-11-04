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

function polyline(
  samples: Array<{ i: number; v: number }>,
  x: (index: number) => number,
  y: (value: number) => number,
): string {
  return samples.map((sample, index) => `${index === 0 ? 'M' : 'L'} ${x(sample.i)} ${y(sample.v)}`).join(' ');
}

export function ProgressLineChart(props: {
  data: ChartDatum[];
  metric: DashboardMetricDef;
  height?: number;
  trend?: Array<number | null>;
  showValues?: boolean;
}): React.JSX.Element {
  const [width, setWidth] = useState(300);
  const height = props.height ?? 200;
  const padTop = props.showValues ? 28 : PAD_TOP;
  const color = colors[props.metric.colorKey];
  const innerWidth = Math.max(width, PAD_LEFT + PAD_RIGHT + props.data.length * STEP);
  const recorded = [
    ...props.data.flatMap((datum) => (datum.value === null ? [] : [datum.value])),
    ...(props.trend ?? []).flatMap((value) => (value === null ? [] : [value])),
  ];
  const max = recorded.length ? Math.max(...recorded) : 1;
  const min = recorded.length ? Math.min(...recorded) : 0;
  const low = Math.min(0, min);
  const span = max - low || 1;
  const plotW = innerWidth - PAD_LEFT - PAD_RIGHT;
  const plotH = height - padTop - PAD_BOTTOM;
  const x = (i: number) => PAD_LEFT + (props.data.length > 1 ? (i / (props.data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => padTop + plotH - ((v - low) / span) * plotH;
  const present = props.data.flatMap((datum, index) => (datum.value === null ? [] : [{ i: index, v: datum.value }]));
  const trend = (props.trend ?? []).flatMap((value, index) => (value === null ? [] : [{ i: index, v: value }]));
  const line = polyline(present, x, y);
  const trendLine = polyline(trend, x, y);
  const base = padTop + plotH;
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
          {trendLine ? (
            <Path d={trendLine} fill="none" stroke="#f59e0b" strokeDasharray="4 3" strokeLinecap="round" strokeWidth={2.5} />
          ) : null}
          {line ? (
            <Path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
          ) : null}
          {present.map((p) => (
            <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} fill="#ffffff" r={3.5} stroke={color} strokeWidth={2} />
          ))}
          {props.showValues
            ? present.map((p) => (
                <SvgText
                  key={`v-${p.i}`}
                  fill={LIGHT.textStrong}
                  fontSize={9}
                  fontWeight="800"
                  textAnchor="middle"
                  x={x(p.i)}
                  y={y(p.v) - 8}
                >
                  {fmt(p.v)}
                </SvgText>
              ))
            : null}
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
