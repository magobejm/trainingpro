import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { buildWellnessTrend, type WellnessTrendPoint, type WellnessTrendRange } from '@trainerpro/shared';
import '../../i18n';
import type { ClientWellnessCheckin, ClientWellnessSession } from '../../data/hooks/useClientWellness';
import { LIGHT } from '../../theme/light';
import {
  CHART_Y_MAX,
  CHART_Y_MIN,
  columnWidth,
  dayTick,
  MOOD_SERIES,
  rpeBarHeight,
  seriesSegments,
  tickEvery,
  xAt,
  yAt,
  type ChartGeometry,
  type MoodSeriesKey,
} from './client-mood-chart.helpers';

type Props = { checkins: ClientWellnessCheckin[]; endDate: string; sessions: ClientWellnessSession[] };
type Active = 'all' | MoodSeriesKey;

const CHART_HEIGHT = 210;
const SERIES_COLORS: Record<MoodSeriesKey, string> = {
  motivation: LIGHT.emerald,
  recovery: LIGHT.purple,
  sleep: LIGHT.accent,
};
const RPE_COLOR = LIGHT.orange;
const RANGES: WellnessTrendRange[] = [7, 30];
const Y_TICKS = [1, 2, 3, 4, 5];

export function ClientMoodTrendChart(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [range, setRange] = useState<WellnessTrendRange>(7);
  const [active, setActive] = useState<Active>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [width, setWidth] = useState(320);
  const points = useMemo(
    () => buildWellnessTrend({ checkins: props.checkins, endDate: props.endDate, range, sessions: props.sessions }),
    [props.checkins, props.endDate, props.sessions, range],
  );
  const visible: MoodSeriesKey[] = active === 'all' ? [...MOOD_SERIES] : [active];
  const geometry: ChartGeometry = { height: CHART_HEIGHT, padBottom: 24, padLeft: 22, padRight: 8, padTop: 10, width };
  const detail = points.find((p) => p.date === selected) ?? null;
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.max(200, event.nativeEvent.layout.width));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('client.mood.chart.title')}</Text>
        <View style={styles.pills}>
          {RANGES.map((value) => (
            <Pill
              key={value}
              label={t(`client.mood.chart.range${value}`)}
              on={range === value}
              onPress={() => setRange(value)}
            />
          ))}
        </View>
      </View>
      <View style={styles.pills}>
        <Pill on={active === 'all'} onPress={() => setActive('all')} label={t('client.mood.chart.compareAll')} />
        {MOOD_SERIES.map((key) => (
          <Pill
            color={SERIES_COLORS[key]}
            key={key}
            label={t(`client.mood.chart.series.${key}`)}
            on={active === key}
            onPress={() => setActive(key)}
          />
        ))}
      </View>
      <View onLayout={onLayout}>
        <Svg height={CHART_HEIGHT} width={width}>
          <ChartGrid geometry={geometry} points={points} />
          {points.map((point, index) => (
            <RpeBar geometry={geometry} index={index} key={point.date} point={point} total={points.length} />
          ))}
          {visible.map((key) => (
            <SeriesLine geometry={geometry} key={key} points={points} seriesKey={key} />
          ))}
        </Svg>
        <View pointerEvents={'box-none'} style={styles.hits}>
          {points.map((point, index) => (
            <DayHit
              column={columnWidth(points.length, geometry)}
              index={index}
              key={point.date}
              label={point.date}
              onPress={() => setSelected(point.date)}
              padLeft={geometry.padLeft}
            />
          ))}
        </View>
      </View>
      <ChartLegend />
      {detail ? <DayDetail point={detail} /> : <Text style={styles.hint}>{t('client.mood.chart.tapHint')}</Text>}
    </View>
  );
}

function ChartGrid(props: { geometry: ChartGeometry; points: WellnessTrendPoint[] }): React.JSX.Element {
  const { geometry: g, points } = props;
  const every = tickEvery(points.length);
  const col = columnWidth(points.length, g);
  return (
    <>
      {points.map((point, index) =>
        point.trained ? (
          <Rect
            fill={LIGHT.accentSoft}
            height={g.height - g.padTop - g.padBottom}
            key={`band-${point.date}`}
            opacity={0.7}
            rx={6}
            width={col}
            x={g.padLeft + col * index}
            y={g.padTop}
          />
        ) : null,
      )}
      {Y_TICKS.map((tick) => (
        <React.Fragment key={tick}>
          <Line
            stroke={LIGHT.borderStrong}
            strokeDasharray={'3 4'}
            strokeWidth={1}
            x1={g.padLeft}
            x2={g.width - g.padRight}
            y1={yAt(tick, g)}
            y2={yAt(tick, g)}
          />
          <SvgText fill={LIGHT.textMuted} fontSize={10} textAnchor={'end'} x={g.padLeft - 5} y={yAt(tick, g) + 3}>
            {String(tick)}
          </SvgText>
        </React.Fragment>
      ))}
      {points.map((point, index) =>
        index % every === 0 || index === points.length - 1 ? (
          <SvgText
            fill={point.trained ? LIGHT.accentDark : LIGHT.textMuted}
            fontSize={10}
            fontWeight={point.trained ? '700' : '400'}
            key={`tick-${point.date}`}
            textAnchor={'middle'}
            x={xAt(index, points.length, g)}
            y={g.height - 8}
          >
            {dayTick(point.date)}
          </SvgText>
        ) : null,
      )}
    </>
  );
}

function RpeBar(props: { geometry: ChartGeometry; index: number; point: WellnessTrendPoint; total: number }) {
  const { geometry: g, point } = props;
  if (point.rpeScaled === null) return null;
  const barWidth = Math.min(18, columnWidth(props.total, g) * 0.6);
  const barHeight = rpeBarHeight(point.rpeScaled, g);
  return (
    <Rect
      fill={RPE_COLOR}
      height={barHeight}
      opacity={0.75}
      rx={3}
      width={barWidth}
      x={xAt(props.index, props.total, g) - barWidth / 2}
      y={yAt(CHART_Y_MIN, g) - barHeight}
    />
  );
}

function SeriesLine(props: { geometry: ChartGeometry; points: WellnessTrendPoint[]; seriesKey: MoodSeriesKey }) {
  const { geometry: g, points, seriesKey } = props;
  const color = SERIES_COLORS[seriesKey];
  return (
    <>
      {seriesSegments(points, seriesKey, g).map((d) => (
        <Path
          d={d}
          fill={'none'}
          key={d}
          stroke={color}
          strokeLinecap={'round'}
          strokeLinejoin={'round'}
          strokeWidth={2.5}
        />
      ))}
      {points.map((point, index) => {
        const value = point[seriesKey];
        if (value === null) return null;
        return <Circle cx={xAt(index, points.length, g)} cy={yAt(value, g)} fill={color} key={point.date} r={3.5} />;
      })}
    </>
  );
}

function ChartLegend(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.swatch, { backgroundColor: RPE_COLOR }]} />
        <Text style={styles.legendText}>{t('client.mood.chart.rpeLegend')}</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.swatch, styles.swatchTrained]} />
        <Text style={styles.legendText}>{t('client.mood.chart.trainedLegend')}</Text>
      </View>
      <Text style={styles.legendText}>{t('client.mood.chart.axis', { max: CHART_Y_MAX, min: CHART_Y_MIN })}</Text>
    </View>
  );
}

function DayDetail({ point }: { point: WellnessTrendPoint }): React.JSX.Element {
  const { t } = useTranslation();
  const dash = '–';
  return (
    <View style={styles.detail}>
      <Text style={styles.detailTitle}>
        {`${point.date} · ${t(point.trained ? 'client.mood.chart.trained' : 'client.mood.chart.rest')}`}
      </Text>
      {MOOD_SERIES.map((key) => (
        <Text key={key} style={styles.detailLine}>
          {`${t(`client.mood.chart.series.${key}`)}: ${point[key] ?? dash}`}
        </Text>
      ))}
      <Text style={styles.detailLine}>
        {`${t('client.mood.chart.rpeLegend')}: ${point.rpe === null ? dash : `${point.rpe}/10`}`}
      </Text>
    </View>
  );
}

function DayHit(props: {
  column: number;
  index: number;
  label: string;
  onPress: () => void;
  padLeft: number;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={props.label}
      accessibilityRole={'button'}
      onPress={props.onPress}
      style={[styles.hit, { left: props.padLeft + props.column * props.index, width: props.column }]}
    />
  );
}

function Pill(props: { color?: string; label: string; on: boolean; onPress: () => void }): React.JSX.Element {
  const tint = props.color ?? LIGHT.accent;
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
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
  },
  detail: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusMd, gap: 2, padding: 10 },
  detailLine: { color: LIGHT.text, fontSize: 12 },
  detailTitle: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '800' },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hit: { backgroundColor: 'transparent', bottom: 0, position: 'absolute', top: 0 },
  hits: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  hint: { color: LIGHT.textMuted, fontSize: 11, textAlign: 'center' },
  legend: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendText: { color: LIGHT.textMuted, fontSize: 11 },
  pill: {
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { color: LIGHT.text, fontSize: 12, fontWeight: '700' },
  pillTextOn: { color: LIGHT.textOnNavy },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: { borderRadius: 3, height: 10, width: 14 },
  swatchTrained: { backgroundColor: LIGHT.accentSoft, borderColor: LIGHT.accentMuted, borderWidth: 1 },
  title: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
});
