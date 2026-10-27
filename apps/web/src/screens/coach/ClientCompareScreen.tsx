import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LoadingState } from '../../components/AsyncStatus';
import { useClientByIdQuery, useClientMeasurementsQuery } from '../../data/hooks/useClientsQuery';
import { useClientPhysicalTestsQuery } from '../../data/hooks/usePhysicalTests';
import { Select, colors, fontSize, space, useBreakpoint } from '@trainerpro/ui';
import { CompareEvolution } from './ClientCompareCharts';
import { CompareReveal } from './ClientCompareReveal';
import {
  buildComparison,
  buildMeasureComparison,
  comparisonDates,
  type CompareMark,
  type CompareMeasure,
  type ComparePhoto,
} from './progress/comparison';

type Translate = (key: string) => string;

export function ClientCompareScreen(props: { clientId: string; t: Translate }): React.JSX.Element {
  const client = useClientByIdQuery(props.clientId);
  const tests = useClientPhysicalTestsQuery(props.clientId);
  const measures = useClientMeasurementsQuery(props.clientId);
  if (client.isLoading || tests.isLoading || measures.isLoading) {
    return <LoadingState label={props.t('coach.compare.title')} />;
  }
  return (
    <CompareBody
      marks={readMarks(tests.data ?? [])}
      measures={readMeasures(measures.data ?? [])}
      photos={readPhotos(client.data?.progressPhotos ?? [])}
      t={props.t}
    />
  );
}

function CompareBody(props: {
  marks: CompareMark[];
  measures: CompareMeasure[];
  photos: ComparePhoto[];
  t: Translate;
}): React.JSX.Element {
  const dates = comparisonDates(props.photos, props.marks, props.measures);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const leftDate = left || dates[0] || '';
  const rightDate = right || dates[dates.length - 1] || '';
  const stacked = useBreakpoint() === 'sm';
  if (dates.length < 2) return <Text style={styles.note}>{props.t('coach.compare.empty')}</Text>;
  const comparison = buildComparison(props.photos, props.marks, leftDate, rightDate);
  const measureRows = buildMeasureComparison(props.measures, leftDate, rightDate);
  return (
    <View style={styles.page}>
      <View style={[styles.dates, stacked && styles.datesStacked]}>
        <DateChoice date={leftDate} dates={dates} onChange={setLeft} t={props.t} which={'from'} />
        <DateChoice date={rightDate} dates={dates} onChange={setRight} t={props.t} which={'to'} />
      </View>
      <CompareReveal after={comparison.rightPhoto} before={comparison.leftPhoto} t={props.t} />
      <CompareEvolution
        leftDate={leftDate}
        marks={props.marks}
        measureRows={measureRows}
        measures={props.measures}
        rightDate={rightDate}
        t={props.t}
        testRows={comparison.rows}
      />
    </View>
  );
}

function DateChoice(props: {
  date: string;
  dates: string[];
  onChange: (value: string) => void;
  t: Translate;
  which: 'from' | 'to';
}): React.JSX.Element {
  return (
    <View style={styles.date}>
      <Select
        label={props.t(`coach.compare.${props.which}`)}
        onChange={props.onChange}
        options={props.dates.map((date) => ({ label: formatDay(date), value: date }))}
        value={props.date}
      />
    </View>
  );
}

function readPhotos(photos: Array<{ archived: boolean; createdAt: string; imageUrl: string }>): ComparePhoto[] {
  return photos
    .filter((photo) => !photo.archived)
    .map((photo) => ({ createdAt: photo.createdAt, imageUrl: photo.imageUrl }));
}

function readMarks(
  assignments: Array<{ physicalTest: { name: string }; results: Array<{ measuredAt: string; rawScore: string }> }>,
): CompareMark[] {
  return assignments.flatMap((assignment) =>
    assignment.results.map((result) => ({
      measuredAt: result.measuredAt,
      name: assignment.physicalTest.name,
      value: result.rawScore,
    })),
  );
}

function readMeasures(
  items: Array<{
    bodyFatPct?: number | null;
    createdAt: string;
    hipCm: number | null;
    measuredAt?: string;
    waistCm: number | null;
    weightKg: number | null;
  }>,
): CompareMeasure[] {
  return items.map((item) => ({
    bodyFatPct: item.bodyFatPct ?? null,
    hipCm: item.hipCm,
    measuredAt: item.measuredAt ?? item.createdAt,
    waistCm: item.waistCm,
    weightKg: item.weightKg,
  }));
}

function formatDay(value: string): string {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

const styles = StyleSheet.create({
  date: { flex: 1, minWidth: 0 },
  dates: { flexDirection: 'row', gap: space.lg },
  datesStacked: { flexDirection: 'column' },
  note: { color: colors.textMuted, fontSize: fontSize.sm, padding: space.md },
  page: { gap: space.lg, padding: space.lg },
});
