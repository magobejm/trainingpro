import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Select, colors, fontSize, space, useBreakpoint } from '@trainerpro/ui';
import { useClientByIdQuery } from '../../../data/hooks/useClientsQuery';
import { useClientPhysicalTestsQuery } from '../../../data/hooks/usePhysicalTests';
import { buildComparison, comparisonDates } from '../progress/comparison';

type Translate = (key: string) => string;

export function ClientComparePanel(props: { clientId: string; t: Translate }): React.JSX.Element {
  const client = useClientByIdQuery(props.clientId).data;
  const tests = useClientPhysicalTestsQuery(props.clientId).data ?? [];
  const photos = (client?.progressPhotos ?? []).map((photo) => ({ createdAt: photo.createdAt, imageUrl: photo.imageUrl }));
  const marks = tests.flatMap((assignment) =>
    assignment.results.map((result) => ({
      measuredAt: result.measuredAt,
      name: assignment.physicalTest.name,
      value: result.rawScore,
    })),
  );
  const dates = useMemo(() => comparisonDates(photos, marks), [photos, marks]);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const leftDate = left || dates[0] || '';
  const rightDate = right || dates[dates.length - 1] || '';
  if (dates.length < 2) return <Text style={styles.note}>{props.t('coach.compare.empty')}</Text>;
  return (
    <CompareBody
      leftDate={leftDate}
      marks={marks}
      onLeft={setLeft}
      onRight={setRight}
      photos={photos}
      rightDate={rightDate}
      t={props.t}
    />
  );
}

function CompareBody(props: {
  leftDate: string;
  marks: Array<{ measuredAt: string; name: string; value: string }>;
  onLeft: (value: string) => void;
  onRight: (value: string) => void;
  photos: Array<{ createdAt: string; imageUrl: string }>;
  rightDate: string;
  t: Translate;
}): React.JSX.Element {
  const dates = comparisonDates(props.photos, props.marks);
  const comparison = buildComparison(props.photos, props.marks, props.leftDate, props.rightDate);
  const stacked = useBreakpoint() === 'sm';
  return (
    <View style={styles.wrap}>
      <View style={styles.dates}>
        <Select
          onChange={props.onLeft}
          options={dates.map((date) => ({ label: date, value: date }))}
          value={props.leftDate}
        />
        <Select
          onChange={props.onRight}
          options={dates.map((date) => ({ label: date, value: date }))}
          value={props.rightDate}
        />
      </View>
      <PhotoPair
        left={comparison.leftPhoto?.imageUrl}
        right={comparison.rightPhoto?.imageUrl}
        stacked={stacked}
        t={props.t}
      />
      {comparison.rows.map((row) => (
        <Text key={row.name} style={styles.row}>{`${row.name}: ${row.before} → ${row.after} (${row.delta})`}</Text>
      ))}
      <Text style={styles.note}>{props.t('coach.compare.currentOnly')}</Text>
    </View>
  );
}

function PhotoPair(props: { left?: string; right?: string; stacked: boolean; t: Translate }): React.JSX.Element | null {
  if (!props.left || !props.right) return null;
  if (props.stacked) {
    return (
      <View style={styles.pair}>
        <Image source={{ uri: props.left }} style={styles.pairPhoto} />
        <Image source={{ uri: props.right }} style={styles.pairPhoto} />
      </View>
    );
  }
  return <PhotoSlider after={props.right} before={props.left} label={props.t('coach.compare.slider')} />;
}

function PhotoSlider(props: { after: string; before: string; label: string }): React.JSX.Element {
  const [position, setPosition] = useState(50);
  const [width, setWidth] = useState(0);
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.slider}>
      <Image source={{ uri: props.before }} style={[styles.photo, { width }]} />
      <View style={[styles.afterClip, { width: (width * position) / 100 }]}>
        <Image source={{ uri: props.after }} style={[styles.photo, { width }]} />
      </View>
      {React.createElement('input', {
        'aria-label': props.label,
        'aria-valuemax': 100,
        'aria-valuemin': 0,
        'aria-valuenow': position,
        max: 100,
        min: 0,
        onChange: (event: { target: { value: string } }) => setPosition(Number(event.target.value)),
        style: sliderStyle,
        type: 'range',
        value: position,
      })}
    </View>
  );
}

const sliderStyle = { width: '100%' } as const;

const styles = StyleSheet.create({
  afterClip: { height: 180, left: 0, overflow: 'hidden', position: 'absolute', top: 0 },
  dates: { flexDirection: 'row', gap: space.sm },
  note: { color: colors.textMuted, fontSize: fontSize.xs, paddingHorizontal: space.md },
  pair: { flexDirection: 'row', gap: space.sm },
  pairPhoto: { flex: 1, height: 180 },
  photo: { height: 180, width: '100%' },
  row: { color: colors.text, fontSize: fontSize.sm, paddingHorizontal: space.md },
  slider: { height: 220, position: 'relative' },
  wrap: { gap: space.sm, paddingBottom: space.md },
});
