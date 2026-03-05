import React from 'react';
import { Text, View } from 'react-native';
import type { ClientView } from '../../../data/hooks/useClientsQuery';
import { styles } from '../ClientProfileScreen.styles';

type Props = {
  client: ClientView;
  t: (key: string) => string;
};

export function ClientProfileAdvancedData(props: Props): React.JSX.Element {
  return (
    <View style={styles.advancedCard}>
      <AdvancedRow
        label={props.t('coach.clientProfile.fields.fitnessLevel')}
        value={resolveFitness(props.client.fitnessLevel, props.t)}
      />
      <AdvancedRow
        label={props.t('coach.clientProfile.fields.secondaryObjectives')}
        value={resolveList(props.client.secondaryObjectives, props.t)}
      />
      <AdvancedRow
        label={props.t('coach.clientProfile.fields.injuries')}
        value={resolveText(props.client.injuries, props.t)}
      />
      <AdvancedRow
        label={props.t('coach.clientProfile.fields.allergies')}
        value={resolveText(props.client.allergies, props.t)}
      />
    </View>
  );
}

function AdvancedRow(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.advancedRow}>
      <Text style={styles.advancedLabel}>{props.label}</Text>
      <Text style={styles.advancedValue}>{props.value}</Text>
    </View>
  );
}

function resolveText(value: null | string | undefined, t: (key: string) => string): string {
  if (!value?.trim()) {
    return t('coach.clientProfile.notReported');
  }
  return value.trim();
}

function resolveList(values: string[] | undefined, t: (key: string) => string): string {
  if (!values || values.length === 0) {
    return t('coach.clientProfile.notReported');
  }
  return values.join(', ');
}

function resolveFitness(value: null | string | undefined, t: (key: string) => string): string {
  if (!value) {
    return t('coach.clientProfile.fitness.unspecified');
  }
  const keyMap: Record<string, string> = {
    advanced: 'coach.clientProfile.fitness.advanced',
    beginner: 'coach.clientProfile.fitness.beginner',
    elite: 'coach.clientProfile.fitness.elite',
    intermediate: 'coach.clientProfile.fitness.intermediate',
  };
  return t(keyMap[value] ?? 'coach.clientProfile.fitness.unspecified');
}
