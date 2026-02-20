import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FilterChips } from '@trainerpro/ui';
import '../../i18n';
import { useCreateIncidentMutation } from '../../data/hooks/useIncidents';

type Severity = 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';

const COLORS = {
  action: '#225fdb',
  bg: '#edf3fb',
  card: '#ffffff',
  input: '#f3f7fd',
  muted: '#627285',
  text: '#0e1a2f',
  white: '#ffffff',
};

export function IncidentCreateScreen(): React.JSX.Element {
  const vm = useIncidentCreateViewModel();
  return <IncidentCreateView {...vm} />;
}

function useIncidentCreateViewModel() {
  const { t } = useTranslation();
  const fields = useIncidentFields();
  const mutation = useCreateIncidentMutation();
  const severityOptions = useMemo(() => mapSeverityOptions(t), [t]);
  const onSubmit = () => {
    mutation.mutate({
      description: fields.description,
      sessionId: fields.sessionId || null,
      sessionItemId: fields.sessionItemId || null,
      severity: fields.severity,
    });
  };
  return {
    ...fields,
    isSuccess: mutation.isSuccess,
    onSubmit,
    severityOptions,
    t,
  };
}

function useIncidentFields() {
  const [description, setDescription] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionItemId, setSessionItemId] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  return {
    description,
    sessionId,
    sessionItemId,
    setDescription,
    setSessionId,
    setSessionItemId,
    setSeverity,
    severity,
  };
}

type ViewModel = ReturnType<typeof useIncidentCreateViewModel>;

function IncidentCreateView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('client.incident.title')}</Text>
      <Text style={styles.subtitle}>{props.t('client.incident.subtitle')}</Text>
      <SeverityCard {...props} />
      <DescriptionCard {...props} />
      <SessionLinkCard {...props} />
      <Pressable onPress={props.onSubmit} style={styles.button}>
        <Text style={styles.buttonLabel}>{props.t('client.incident.submit')}</Text>
      </Pressable>
      {props.isSuccess ? <Text style={styles.success}>{props.t('client.incident.success')}</Text> : null}
    </ScrollView>
  );
}

function SeverityCard(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('client.incident.severity')}</Text>
      <FilterChips
        activeId={props.severity}
        items={props.severityOptions}
        onSelect={toSelect(props)}
      />
    </View>
  );
}

function DescriptionCard(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('client.incident.description')}</Text>
      <TextInput
        multiline
        onChangeText={props.setDescription}
        placeholder={props.t('client.incident.descriptionPlaceholder')}
        style={styles.textArea}
        value={props.description}
      />
    </View>
  );
}

function SessionLinkCard(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('client.incident.sessionId')}</Text>
      <TextInput
        onChangeText={props.setSessionId}
        placeholder={props.t('client.incident.sessionIdPlaceholder')}
        style={styles.input}
        value={props.sessionId}
      />
      <Text style={styles.label}>{props.t('client.incident.sessionItemId')}</Text>
      <TextInput
        onChangeText={props.setSessionItemId}
        placeholder={props.t('client.incident.sessionItemIdPlaceholder')}
        style={styles.input}
        value={props.sessionItemId}
      />
    </View>
  );
}

function toSelect(props: ViewModel) {
  return (id: string) => {
    props.setSeverity(id as Severity);
  };
}

function mapSeverityOptions(t: (key: string) => string) {
  return [
    { id: 'LOW', label: t('client.incident.severity.low') },
    { id: 'MEDIUM', label: t('client.incident.severity.medium') },
    { id: 'HIGH', label: t('client.incident.severity.high') },
    { id: 'CRITICAL', label: t('client.incident.severity.critical') },
  ];
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    minHeight: '100%',
    padding: 16,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    width: '100%',
  },
  success: {
    color: COLORS.action,
    fontSize: 13,
    fontWeight: '700',
    width: '100%',
  },
  textArea: {
    backgroundColor: COLORS.input,
    borderRadius: 10,
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    width: '100%',
  },
});
