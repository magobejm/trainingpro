import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { formatMeasureDate, type MeasureRecord } from './client-measures';

type Translate = (key: string, params?: Record<string, number | string>) => string;

const LABELS: Record<string, string> = {
  bodyFatPct: 'coach.compare.bodyFat',
  fcMax: 'coach.measures.fcMax',
  fcRest: 'coach.measures.fcRest',
  heightCm: 'coach.clientProfile.stats.height',
  hipCm: 'coach.compare.hip',
  waistCm: 'coach.compare.waist',
  weightKg: 'coach.compare.weight',
};

const UNITS: Record<string, string> = {
  bodyFatPct: '%',
  fcMax: 'ppm',
  fcRest: 'ppm',
  heightCm: 'cm',
  hipCm: 'cm',
  waistCm: 'cm',
  weightKg: 'kg',
};

/** Every saved record, newest first, with the author and that day's numbers. */
export function MeasuresRecords(props: { records: MeasureRecord[]; t: Translate }): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{props.t('coach.measures.records')}</Text>
      {props.records.length === 0 ? (
        <Text style={styles.empty}>{props.t('coach.clientProfile.editPage.measurementHistoryEmpty')}</Text>
      ) : (
        props.records.map((record, index) => <RecordRow key={`${record.at}-${index}`} record={record} t={props.t} />)
      )}
    </View>
  );
}

function RecordRow(props: { record: MeasureRecord; t: Translate }): React.JSX.Element {
  const author =
    props.record.recordedBy === 'client'
      ? props.t('coach.clientProfile.editPage.measurementByClient')
      : props.t('coach.clientProfile.editPage.measurementByCoach');
  const values = props.record.values.map((item) => valueText(item.key, item.value, props.t)).join(' · ');
  return (
    <View style={styles.row}>
      <Text style={styles.date}>{formatMeasureDate(props.record.at)}</Text>
      <Text style={styles.author}>{author}</Text>
      {values ? <Text style={styles.values}>{values}</Text> : null}
    </View>
  );
}

function valueText(key: string, value: number, t: Translate): string {
  const label = LABELS[key];
  const name = label ? t(label) : key;
  const unit = UNITS[key];
  return unit ? `${name} ${value} ${unit}` : `${name} ${value}`;
}

const styles = StyleSheet.create({
  author: { color: colors.textMuted, fontSize: fontSize.sm },
  date: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.xs,
    padding: space.md,
  },
  section: { gap: space.sm },
  values: { color: colors.text, fontSize: fontSize.sm },
});
