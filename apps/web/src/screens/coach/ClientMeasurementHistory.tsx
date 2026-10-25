import React from 'react';
import { Text, View } from 'react-native';
import { useClientMeasurementsQuery, type ClientMeasurementView } from '../../data/hooks/useClientsQuery';
import { ClientIntakeStatus, MeasurementTools } from './MeasurementTools';
import { styles } from './ClientProfileEditScreen.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const FIELDS = ['weightKg', 'waistCm', 'hipCm', 'heightCm'] as const;

export function ClientMeasurementHistory(props: { clientId: string; t: Translate }): React.JSX.Element {
  const query = useClientMeasurementsQuery(props.clientId);
  const items = query.data ?? [];
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('coach.clientProfile.editPage.measurementHistory')}</Text>
      {items.length === 0 ? <EmptyHistory t={props.t} /> : null}
      <ClientIntakeStatus clientId={props.clientId} t={props.t} />
      <MeasurementTools clientId={props.clientId} t={props.t} />
      {items.map((item) => (
        <Text key={item.id} style={styles.helperText}>
          {formatEntry(item, props.t)}
        </Text>
      ))}
    </View>
  );
}

function EmptyHistory(props: { t: Translate }): React.JSX.Element {
  return <Text style={styles.helperText}>{props.t('coach.clientProfile.editPage.measurementHistoryEmpty')}</Text>;
}

function formatEntry(item: ClientMeasurementView, t: Translate): string {
  const when = new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const authorKey =
    item.recordedBy === 'client'
      ? 'coach.clientProfile.editPage.measurementByClient'
      : 'coach.clientProfile.editPage.measurementByCoach';
  const author = t(authorKey);
  const values = FIELDS.flatMap((key) =>
    typeof item[key] === 'number' ? [`${t(FIELD_LABEL[key])} ${String(item[key])}`] : [],
  );
  return `${when} · ${author} · ${values.join(', ')}`;
}

const FIELD_LABEL = {
  heightCm: 'coach.clientProfile.stats.height',
  hipCm: 'coach.clientProfile.stats.hip',
  waistCm: 'coach.clientProfile.stats.waist',
  weightKg: 'coach.clientProfile.stats.weight',
} as const;
