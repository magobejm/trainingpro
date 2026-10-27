import { QueryResult } from '../../components/AsyncStatus';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormatDate } from '../../i18n/useFormatDate';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import { Breadcrumbs } from '../../layout/Breadcrumbs';
import { buildClientCrumbs } from '../../layout/crumbs';
import { useMenuEpoch } from '../../layout/menu-client-context';
import {
  useAdjustmentDraftMutation,
  useIncidentsQuery,
  useRespondIncidentMutation,
  useReviewIncidentMutation,
  useTagIncidentMutation,
  type IncidentView,
} from '../../data/hooks/useIncidents';
import { clientCardItems } from './client-card-items';
import { LIST_KEYS } from '../../layout/list-context';
import { reviveClientId, useListContext, useRouteClient } from '../../layout/useListContext';
import { Button, Card, ClientCardRow, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';
import { styles as clientStyles } from './clients-screen.styles';

type IncidentSelection = { clientId: string; fromProfile: boolean };

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

export function IncidentsScreen(): React.JSX.Element {
  const vm = useIncidentsViewModel();
  return <IncidentsView {...vm} />;
}

function useIncidentsViewModel() {
  const { t } = useTranslation();
  const clientsQuery = useClientsQuery();
  const [client, setClient] = useListContext(LIST_KEYS.incidents, { clientId: '', fromProfile: false }, reviveIncidents);
  const clientId = client.clientId;
  const setClientId = (nextId: string) =>
    setClient((prev) => ({ clientId: nextId, fromProfile: nextId === prev.clientId && prev.fromProfile }));
  useLeaveProfileOrigin(setClient);
  useRouteClient(clientId);
  const incidentsQuery = useIncidentsQuery({ clientId: clientId || undefined });
  const actions = useIncidentActions();
  const clients = clientsQuery.data ?? [];
  const clientItems = useMemo(
    () => [{ id: '', title: t('coach.incidents.allClients'), subtitle: '' }, ...clientCardItems(clients, t)],
    [clients, t],
  );
  const clientNames = useMemo(
    () => new Map(clients.map((item) => [item.id, `${item.firstName} ${item.lastName}`.trim()])),
    [clients],
  );
  return {
    clientId,
    clientItems,
    clientName: clientNames.get(clientId) ?? '',
    clientNames,
    fromProfile: client.fromProfile && clientId.length > 0,
    incidents: incidentsQuery.data ?? [],
    error: incidentsQuery.error,
    isError: incidentsQuery.isError,
    onRetry: () => void incidentsQuery.refetch(),
    isLoading: incidentsQuery.isLoading,
    ...buildActions(actions),
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

function buildActions(actions: ReturnType<typeof useIncidentActions>) {
  return {
    onCreateDraft: (id: string, draft: string) => actions.draftMutation.mutate({ id, payload: { draft } }),
    onReply: (id: string, response: string) => actions.respondMutation.mutate({ id, payload: { response } }),
    onReview: (id: string) => actions.reviewMutation.mutate({ id }),
    onTag: (id: string, tag: string) => actions.tagMutation.mutate({ id, payload: { tag } }),
  };
}

type ViewModel = ReturnType<typeof useIncidentsViewModel>;

function reviveIncidents(stored: IncidentSelection | null, initial: IncidentSelection): IncidentSelection {
  const revived = reviveClientId(stored, initial);
  return { clientId: revived.clientId, fromProfile: Boolean(stored?.clientId && stored.fromProfile) };
}

function useLeaveProfileOrigin(setClient: React.Dispatch<React.SetStateAction<IncidentSelection>>): void {
  const epoch = useMenuEpoch();
  const seen = useRef(epoch);
  useEffect(() => {
    if (seen.current === epoch) return;
    seen.current = epoch;
    setClient((prev) => ({ ...prev, fromProfile: false }));
  }, [epoch, setClient]);
}

function IncidentsView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      {props.fromProfile ? <IncidentOriginBar clientId={props.clientId} clientName={props.clientName} t={props.t} /> : null}
      <Text style={styles.title}>{props.t('coach.incidents.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.incidents.subtitle')}</Text>
      <ClientCardRow items={props.clientItems} onItemPress={props.setClientId} selectedId={props.clientId} />
      <IncidentList {...props} />
    </ScrollView>
  );
}

function IncidentOriginBar(props: { clientId: string; clientName: string; t: ViewModel['t'] }): React.JSX.Element {
  const crumbs = buildClientCrumbs({
    clientId: props.clientId,
    clientName: props.clientName,
    mode: 'incidents',
    t: props.t,
  });
  return (
    <View style={clientStyles.breadcrumbCard}>
      <Breadcrumbs accessibilityLabel={props.t('app.breadcrumb')} crumbs={crumbs} />
    </View>
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
  const format = useFormatDate();
  return (
    <View {...{ dataSet: { 'density-list': 'true' } }} style={styles.stack}>
      {props.incidents.map((incident) => (
        <IncidentCard
          clientName={props.clientNames.get(incident.clientId) ?? ''}
          format={format}
          incident={incident}
          key={incident.id}
          vm={props}
        />
      ))}
    </View>
  );
}

function IncidentCard(props: {
  clientName: string;
  format: (value: string) => string;
  incident: IncidentView;
  vm: ViewModel;
}): React.JSX.Element {
  const { incident, vm } = props;
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(incident.coachResponse ?? '');
  const [tag, setTag] = useState(incident.tag ?? '');
  const [draft, setDraft] = useState(incident.adjustmentDraft ?? '');
  return (
    <Card densityRow style={styles.card}>
      <Text style={styles.incidentTitle}>{props.clientName}</Text>
      <Text style={styles.meta}>{`${incident.severity} · ${incident.status} · ${props.format(incident.createdAt)}`}</Text>
      <Text style={styles.description}>{incident.description}</Text>
      <Text style={styles.meta}>{incident.tag ?? vm.t('coach.incidents.noTag')}</Text>
      <SavedNote
        label={vm.t('coach.incidents.responseLabel')}
        value={incident.coachResponse}
        empty={vm.t('coach.incidents.noResponse')}
      />
      <SavedNote label={vm.t('coach.incidents.draftLabel')} value={incident.adjustmentDraft} empty={''} />
      <Button
        label={vm.t(open ? 'coach.incidents.closeActions' : 'coach.incidents.manage')}
        onPress={() => setOpen((current) => !current)}
        size={SIZE_SM}
        variant={VARIANT_SECONDARY}
      />
      {open ? (
        <IncidentEditor
          draft={draft}
          incidentId={incident.id}
          reply={reply}
          setDraft={setDraft}
          setReply={setReply}
          setTag={setTag}
          tag={tag}
          vm={vm}
        />
      ) : null}
    </Card>
  );
}

function SavedNote(props: { empty: string; label: string; value: null | string }): React.JSX.Element | null {
  if (!props.value && !props.empty) return null;
  return <Text style={styles.meta}>{`${props.label}: ${props.value ?? props.empty}`}</Text>;
}

function IncidentEditor(props: {
  draft: string;
  incidentId: string;
  reply: string;
  setDraft: (value: string) => void;
  setReply: (value: string) => void;
  setTag: (value: string) => void;
  tag: string;
  vm: ViewModel;
}): React.JSX.Element {
  const { incidentId, vm } = props;
  return (
    <View style={styles.inputs}>
      <TextField onChangeText={props.setReply} placeholder={vm.t('coach.incidents.replyPlaceholder')} value={props.reply} />
      <TextField onChangeText={props.setTag} placeholder={vm.t('coach.incidents.tagPlaceholder')} value={props.tag} />
      <TextField onChangeText={props.setDraft} placeholder={vm.t('coach.incidents.draftPlaceholder')} value={props.draft} />
      <View style={styles.row}>
        <ActionButton
          label={vm.t('coach.incidents.review')}
          loading={vm.pending.review === incidentId}
          onPress={() => vm.onReview(incidentId)}
        />
        <ActionButton
          label={vm.t('coach.incidents.reply')}
          loading={vm.pending.reply === incidentId}
          onPress={() => vm.onReply(incidentId, props.reply)}
        />
        <ActionButton
          label={vm.t('coach.incidents.tag')}
          loading={vm.pending.tag === incidentId}
          onPress={() => vm.onTag(incidentId, props.tag)}
        />
        <ActionButton
          label={vm.t('coach.incidents.adjust')}
          loading={vm.pending.draft === incidentId}
          onPress={() => vm.onCreateDraft(incidentId, props.draft)}
        />
      </View>
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
