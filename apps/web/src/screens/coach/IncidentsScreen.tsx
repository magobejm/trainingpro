import { QueryResult } from '../../components/AsyncStatus';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import {
  useAdjustmentDraftMutation,
  useIncidentsQuery,
  useRespondIncidentMutation,
  useReviewIncidentMutation,
  useTagIncidentMutation,
} from '../../data/hooks/useIncidents';
import { clientCardItems } from './client-card-items';
import { LIST_KEYS } from '../../layout/list-context';
import { reviveClientId, useListContext, useRouteClient } from '../../layout/useListContext';
import { Button, Card, ClientCardRow, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

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
    () => [{ id: '', title: t('coach.incidents.allClients'), subtitle: '' }, ...clientCardItems(clientsQuery.data ?? [], t)],
    [clientsQuery.data, t],
  );
  return {
    clientId,
    clientItems,
    ...fields,
    incidents: incidentsQuery.data ?? [],
    error: incidentsQuery.error,
    isError: incidentsQuery.isError,
    onRetry: () => void incidentsQuery.refetch(),
    isLoading: incidentsQuery.isLoading,
    ...buildActions(actions, fields),
    pending: readPendingIds(actions),
    setClientId,
    t,
  };
}

function readPendingIds(actions: ReturnType<typeof useIncidentActions>) {
  return {
    draft: actions.draftMutation.isPending ? actions.draftMutation.variables?.id : undefined,
    reply: actions.respondMutation.isPending ? actions.respondMutation.variables?.id : undefined,
    review: actions.reviewMutation.isPending ? actions.reviewMutation.variables?.id : undefined,
    tag: actions.tagMutation.isPending ? actions.tagMutation.variables?.id : undefined,
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
      <ClientCardRow items={props.clientItems} onItemPress={props.setClientId} selectedId={props.clientId} />
      <IncidentList {...props} />
    </ScrollView>
  );
}

function IncidentList(props: ViewModel) {
  const status = QueryResult({
    emptyTitle: props.t('coach.incidents.empty'),
    skeleton: 'rows',
    error: props.error,
    isError: props.isError,
    isLoading: props.isLoading,
    itemCount: props.incidents.length,
    onRetry: props.onRetry,
  });
  if (status) return status;
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
    <Card key={incident.id} style={styles.card}>
      <Text style={styles.incidentTitle}>{`${incident.severity} · ${incident.status}`}</Text>
      <Text style={styles.meta}>{new Date(incident.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.description}>{incident.description}</Text>
      <Text style={styles.meta}>{incident.tag ?? props.t('coach.incidents.noTag')}</Text>
      <Text style={styles.meta}>{incident.coachResponse ?? props.t('coach.incidents.noResponse')}</Text>
      <ActionInputs {...props} />
      <ActionButtons props={props} incidentId={incident.id} />
    </Card>
  );
}

function ActionInputs(props: ViewModel) {
  return (
    <View style={styles.inputs}>
      <TextField
        onChangeText={props.setReply}
        placeholder={props.t('coach.incidents.replyPlaceholder')}
        value={props.reply}
      />
      <TextField onChangeText={props.setTag} placeholder={props.t('coach.incidents.tagPlaceholder')} value={props.tag} />
      <TextField
        onChangeText={props.setDraft}
        placeholder={props.t('coach.incidents.draftPlaceholder')}
        value={props.draft}
      />
    </View>
  );
}

function ActionButtons(props: { incidentId: string; props: ViewModel }) {
  const { incidentId, props: vm } = props;
  return (
    <View style={styles.row}>
      <ActionButton
        label={vm.t('coach.incidents.review')}
        loading={vm.pending.review === incidentId}
        onPress={() => vm.onReview(incidentId)}
      />
      <ActionButton
        label={vm.t('coach.incidents.reply')}
        loading={vm.pending.reply === incidentId}
        onPress={() => vm.onReply(incidentId)}
      />
      <ActionButton
        label={vm.t('coach.incidents.tag')}
        loading={vm.pending.tag === incidentId}
        onPress={() => vm.onTag(incidentId)}
      />
      <ActionButton
        label={vm.t('coach.incidents.adjust')}
        loading={vm.pending.draft === incidentId}
        onPress={() => vm.onCreateDraft(incidentId)}
      />
    </View>
  );
}

function ActionButton(props: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <Button label={props.label} loading={props.loading} onPress={props.onPress} size={SIZE_SM} variant={VARIANT_SECONDARY} />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: space.sm,
    padding: space.md,
  },
  description: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  incidentTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  inputs: {
    gap: space.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  page: {
    backgroundColor: colors.background,
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
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
});
