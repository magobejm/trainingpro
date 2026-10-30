import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FilterChips } from '@trainerpro/ui';
import '../../i18n';
import type { FeedbackCategory } from '../../data/hooks/useClientNotes';
import { useCreateIncidentMutation } from '../../data/hooks/useIncidents';
import { FeedbackCategoryPicker } from './FeedbackCategoryPicker';
import { LIGHT } from '../../theme/light';

type Severity = 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';

const COLORS = {
  action: LIGHT.accent,
  bg: LIGHT.bgSoft,
  card: LIGHT.bgCard,
  input: LIGHT.bgSoft,
  muted: LIGHT.textMuted,
  text: LIGHT.textStrong,
  white: LIGHT.textOnNavy,
};

export function IncidentCreateScreen(): React.JSX.Element {
  const vm = useIncidentCreateViewModel(undefined);
  return <IncidentCreateView {...vm} />;
}

export function IncidentCreatePanel({ onCreated }: { onCreated?: () => void }): React.JSX.Element {
  const vm = useIncidentCreateViewModel(onCreated);
  return <IncidentCreateView {...vm} />;
}

function useIncidentCreateViewModel(onCreated: (() => void) | undefined) {
  const { t } = useTranslation();
  const fields = useIncidentFields();
  const mutation = useCreateIncidentMutation();
  const severityOptions = useMemo(() => mapSeverityOptions(t), [t]);
  const onSubmit = () => {
    if (!fields.scope) return;
    mutation.mutate(
      {
        category: fields.scope,
        description: fields.description,
        sessionId: fields.sessionId || null,
        sessionItemId: fields.sessionItemId || null,
        severity: fields.severity,
      },
      { onSuccess: onCreated },
    );
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
  const [scope, setScope] = useState<FeedbackCategory | null>(null);
  return {
    description,
    sessionId,
    sessionItemId,
    scope,
    setDescription,
    setScope,
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
      <View style={styles.card}>
        <FeedbackCategoryPicker onChange={props.setScope} value={props.scope} />
      </View>
      <SeverityCard {...props} />
      <DescriptionCard {...props} />
      <SessionLinkCard {...props} />
      <Pressable
        disabled={props.scope === null}
        onPress={props.onSubmit}
        style={[styles.button, props.scope === null ? styles.buttonDisabled : null]}
      >
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
      <FilterChips activeId={props.severity} items={props.severityOptions} onSelect={toSelect(props)} />
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
  buttonDisabled: { opacity: 0.45 },
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
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.input,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    color: LIGHT.textStrong,
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
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    color: LIGHT.textStrong,
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
