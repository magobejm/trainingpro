import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useClientByIdQuery } from '../../data/hooks/useClientsQuery';

const COLORS = {
  bg: '#edf3fb',
  card: '#ffffff',
  muted: '#627285',
  text: '#0e1a2f',
};

const PROFILE_FIELD_KEYS = [
  'coach.clientProfile.fields.email',
  'coach.clientProfile.fields.phone',
  'coach.clientProfile.fields.objective',
  'coach.clientProfile.fields.notes',
  'coach.clientProfile.fields.sex',
  'coach.clientProfile.fields.heightCm',
  'coach.clientProfile.fields.birthDate',
] as const;

type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];

type Props = {
  clientId: string;
};

export function ClientProfileScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientByIdQuery(props.clientId);
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('coach.clientProfile.title')}</Text>
        {renderBody(query.data, t('coach.clientProfile.empty'))}
      </View>
    </View>
  );
}

function renderBody(
  client: ReturnType<typeof useClientByIdQuery>['data'],
  emptyLabel: string,
): React.JSX.Element {
  if (!client) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }
  const values = resolveFieldValues(client);
  return (
    <View style={styles.grid}>
      {PROFILE_FIELD_KEYS.map((fieldKey) => (
        <ProfileLine key={fieldKey} label={fieldKey} value={values[fieldKey]} />
      ))}
    </View>
  );
}

function resolveFieldValues(
  client: NonNullable<ReturnType<typeof useClientByIdQuery>['data']>,
): Record<ProfileFieldKey, string> {
  return {
    'coach.clientProfile.fields.birthDate': client.birthDate ?? '-',
    'coach.clientProfile.fields.email': client.email,
    'coach.clientProfile.fields.heightCm': formatHeight(client.heightCm),
    'coach.clientProfile.fields.notes': client.notes ?? '-',
    'coach.clientProfile.fields.objective': client.objective ?? '-',
    'coach.clientProfile.fields.phone': client.phone ?? '-',
    'coach.clientProfile.fields.sex': client.sex ?? '-',
  };
}

function ProfileLine(props: { label: ProfileFieldKey; value: string }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{t(props.label)}</Text>
      <Text style={styles.value}>{props.value}</Text>
    </View>
  );
}

function formatHeight(heightCm: null | number): string {
  return heightCm ? `${heightCm}` : '-';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    width: '100%',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  grid: {
    gap: 10,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    width: 120,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  value: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
  },
});
