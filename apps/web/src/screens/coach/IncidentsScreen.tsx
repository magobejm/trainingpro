import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import {
  useAdjustmentDraftMutation,
  useIncidentsQuery,
  useRespondIncidentMutation,
  useReviewIncidentMutation,
  useTagIncidentMutation,
} from '../../data/hooks/useIncidents';
import { ClientSelectionStrip } from './components/ClientSelectionStrip';
import { LIST_KEYS } from '../../layout/list-context';
import { reviveClientId, useListContext, useRouteClient } from '../../layout/useListContext';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  action: colors.primary,
  bg: colors.background,
  card: colors.surface,
  input: colors.background,
  muted: colors.textMuted,
  text: colors.text,
  white: colors.surface,
};

export function IncidentsScreen(): React.JSX.Element {
  const vm = useIncidentsViewModel();
  return <IncidentsView {...vm} />;
}

function useIncidentsViewModel() {
  const { t } = useTranslation();
  const clientsQuery = useClientsQuery();
  const [client, setClient] = useListContext(LIST_KEYS.incidents, { clientId: '' }, reviveClientId);
  const clientId = client.clientId;
  const setClientId = (nextId: string) => setClient({ clientId: nextId });
  useRouteClient(clientId);
  const incidentsQuery = useIncidentsQuery({ clientId: clientId || undefined });
  const actions = useIncidentActions();
  const fields = useIncidentActionFields();
  useClearIncidentDraft(clientId, fields);
  const clientItems = useMemo(
    () => mapClientItems(clientsQuery.data ?? [], t('coach.incidents.allClients')),
    [clientsQuery.data, t],
  );
  return {
    clientId,
    clientItems,
    ...fields,
    incidents: incidentsQuery.data ?? [],
    isLoading: incidentsQuery.isLoading,
    ...buildActions(actions, fields),
    setClientId,
    t,
  };
}

function useIncidentActions() {
  const reviewMutation = useReviewIncidentMutation();
  const respondMutation = useRespondIncidentMutation();
  const tagMutation = useTagIncidentMutation();
  const draftMutation = useAdjustmentDraftMutation();
  return { draftMutation, respondMutation, reviewMutation, tagMutation };
}

function useClearIncidentDraft(clientId: string, fields: ReturnType<typeof useIncidentActionFields>): void {
  const previous = useRef(clientId);
  const { setDraft, setReply, setTag } = fields;
  useEffect(() => {
    if (previous.current === clientId) return;
    previous.current = clientId;
    setReply('');
    setTag('');
    setDraft('');
  }, [clientId, setDraft, setReply, setTag]);
}

function useIncidentActionFields() {
  const [reply, setReply] = useState('');
  const [tag, setTag] = useState('');
  const [draft, setDraft] = useState('');
  return { draft, reply, setDraft, setReply, setTag, tag };
}

function buildActions(actions: ReturnType<typeof useIncidentActions>, fields: ReturnType<typeof useIncidentActionFields>) {
  return {
    onCreateDraft: (id: string) => actions.draftMutation.mutate({ id, payload: { draft: fields.draft } }),
    onReply: (id: string) => actions.respondMutation.mutate({ id, payload: { response: fields.reply } }),
    onReview: (id: string) => actions.reviewMutation.mutate({ id }),
    onTag: (id: string) => actions.tagMutation.mutate({ id, payload: { tag: fields.tag } }),
  };
}

type ViewModel = ReturnType<typeof useIncidentsViewModel>;

function IncidentsView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.incidents.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.incidents.subtitle')}</Text>
      <ClientSelectionStrip
        emptyLabel={props.t('coach.incidents.allClients')}
        items={props.clientItems}
        loading={props.isLoading && props.clientItems.length === 0}
        onSelect={props.setClientId}
        selectedId={props.clientId}
        showArrows
      />
      <IncidentList {...props} />
    </ScrollView>
  );
}

function IncidentList(props: ViewModel) {
  if (props.isLoading) {
    return <Text style={styles.info}>{props.t('coach.incidents.loading')}</Text>;
  }
  if (props.incidents.length === 0) {
    return <Text style={styles.info}>{props.t('coach.incidents.empty')}</Text>;
  }
  return <View style={styles.stack}>{props.incidents.map((incident) => renderIncidentCard(props, incident))}</View>;
}

function renderIncidentCard(
  props: ViewModel,
  incident: {
    coachResponse: null | string;
    createdAt: string;
    description: string;
    id: string;
    severity: string;
    status: string;
    tag: null | string;
  },
) {
  return (
    <View key={incident.id} style={styles.card}>
      <Text style={styles.incidentTitle}>{`${incident.severity} · ${incident.status}`}</Text>
      <Text style={styles.meta}>{new Date(incident.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.description}>{incident.description}</Text>
      <Text style={styles.meta}>{incident.tag ?? props.t('coach.incidents.noTag')}</Text>
      <Text style={styles.meta}>{incident.coachResponse ?? props.t('coach.incidents.noResponse')}</Text>
      <ActionInputs {...props} />
      <ActionButtons props={props} incidentId={incident.id} />
    </View>
  );
}

function ActionInputs(props: ViewModel) {
  return (
    <View style={styles.inputs}>
      <TextInput
        onChangeText={props.setReply}
        placeholder={props.t('coach.incidents.replyPlaceholder')}
        style={styles.input}
        value={props.reply}
      />
      <TextInput
        onChangeText={props.setTag}
        placeholder={props.t('coach.incidents.tagPlaceholder')}
        style={styles.input}
        value={props.tag}
      />
      <TextInput
        onChangeText={props.setDraft}
        placeholder={props.t('coach.incidents.draftPlaceholder')}
        style={styles.input}
        value={props.draft}
      />
    </View>
  );
}

function ActionButtons(props: { incidentId: string; props: ViewModel }) {
  return (
    <View style={styles.row}>
      <ActionButton label={props.props.t('coach.incidents.review')} onPress={() => props.props.onReview(props.incidentId)} />
      <ActionButton label={props.props.t('coach.incidents.reply')} onPress={() => props.props.onReply(props.incidentId)} />
      <ActionButton label={props.props.t('coach.incidents.tag')} onPress={() => props.props.onTag(props.incidentId)} />
      <ActionButton
        label={props.props.t('coach.incidents.adjust')}
        onPress={() => props.props.onCreateDraft(props.incidentId)}
      />
    </View>
  );
}

function ActionButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.button}>
      <Text style={styles.buttonLabel}>{props.label}</Text>
    </Pressable>
  );
}

function mapClientItems(
  clients: Array<{
    avatarUrl: null | string;
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  }>,
  allLabel: string,
) {
  const allCard: Array<{ avatarUrl: null | string; email: string; id: string; name: string }> = [
    { avatarUrl: null, email: allLabel, id: '', name: allLabel },
  ];
  const items = clients.map((client) => ({
    avatarUrl: client.avatarUrl,
    email: client.email,
    id: client.id,
    name: `${client.firstName} ${client.lastName}`.trim(),
  }));
  return [...allCard, ...items];
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: radius.md,
    minHeight: 34,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    gap: space.sm,
    padding: space.md,
  },
  description: {
    color: COLORS.text,
    fontSize: fontSize.sm,
  },
  incidentTitle: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  info: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  inputs: {
    gap: space.sm,
  },
  meta: {
    color: COLORS.muted,
    fontSize: fontSize.xs,
  },
  page: {
    backgroundColor: COLORS.bg,
    gap: space.md,
    minHeight: '100%',
    padding: space.xl,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  stack: {
    gap: space.md,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
});
