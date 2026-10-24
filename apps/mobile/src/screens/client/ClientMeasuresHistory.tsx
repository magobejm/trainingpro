import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';
import { formatDelta, previousMeasure, type MeasurementKey } from './client-measures.helpers';
import { useClientMeasurementsQuery, type ClientMeasurement } from './use-client-progress';

const FIELDS: MeasurementKey[] = ['weightKg', 'waistCm', 'hipCm', 'heightCm'];
const LABELS: Record<MeasurementKey, string> = {
  heightCm: 'client.measures.fields.height',
  hipCm: 'client.measures.fields.hip',
  waistCm: 'client.measures.fields.waist',
  weightKg: 'client.measures.fields.weight',
};

export function ClientMeasuresHistory(): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientMeasurementsQuery();
  const items = query.data ?? [];
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('client.measures.history.title')}</Text>
      {items.length === 0 ? <Text style={styles.empty}>{t('client.measures.history.empty')}</Text> : null}
      {items.map((item, index) => (
        <HistoryRow index={index} item={item} items={items} key={item.id} t={t} />
      ))}
    </View>
  );
}

function HistoryRow(props: {
  index: number;
  item: ClientMeasurement;
  items: ClientMeasurement[];
  t: (key: string) => string;
}): React.JSX.Element {
  const author = props.t(
    props.item.recordedBy === 'client' ? 'client.measures.history.byClient' : 'client.measures.history.byCoach',
  );
  return (
    <View style={styles.row}>
      <Text style={styles.when}>{`${formatWhen(props.item.createdAt)} · ${author}`}</Text>
      <Text style={styles.values}>{fieldsLine(props.item, props.items, props.index, props.t)}</Text>
    </View>
  );
}

function fieldsLine(item: ClientMeasurement, items: ClientMeasurement[], index: number, t: (key: string) => string): string {
  return FIELDS.flatMap((key) => {
    const value = item[key];
    if (typeof value !== 'number') return [];
    const delta = formatDelta(value, previousMeasure(items, index, key));
    const label = `${t(LABELS[key])} ${String(value)}`;
    return [delta ? `${label} (${delta})` : label];
  }).join(' · ');
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  empty: { color: LIGHT.textMuted, fontSize: 13, marginTop: 8 },
  row: { borderBottomColor: LIGHT.border, borderBottomWidth: 1, gap: 4, paddingVertical: 10 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  title: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  values: { color: LIGHT.text, fontSize: 14 },
  when: { color: LIGHT.textMuted, fontSize: 12 },
});
