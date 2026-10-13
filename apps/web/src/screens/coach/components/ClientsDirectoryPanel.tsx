import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ClientCardRow, EmptyState, Select, TextField, useBreakpoint } from '@trainerpro/ui';
import { QueryResult } from '../../../components/AsyncStatus';
import type { ClientView } from '../../../data/hooks/useClientsQuery';
import { matchesSearch } from '../../../utils/normalize-search';
import type { ClientSelectorItem } from './ClientSelectionStrip';
import { sortClients, type ClientSort } from '../clients-sort';
import { useListContext } from '../../../layout/useListContext';
import { styles } from './ClientsDirectoryPanel.styles';

type Props = {
  clients: ClientView[];
  clientsError: unknown;
  clientsLoading: boolean;
  objectiveFilter: string;
  onObjectiveFilterChange: (nextValue: string) => void;
  onCreateClient?: () => void;
  onRetry: () => void;
  onSearchValueChange: (nextValue: string) => void;
  onSelectClient: (clientId: string) => void;
  searchValue: string;
  selectedClientId: string;
  t: (key: string) => string;
};

export function ClientsDirectoryPanel(props: Props): React.JSX.Element {
  const vm = useDirectoryModel(props);
  const hasActiveFilter = props.searchValue.trim().length > 0 || props.objectiveFilter !== 'ALL';
  const isEmpty = !props.clientsLoading && !props.clientsError && !hasActiveFilter && vm.items.length === 0;
  const status = isEmpty ? (
    <EmptyState
      actionLabel={props.onCreateClient ? props.t('coach.clients.form.submit') : undefined}
      message={props.t('coach.clients.emptyHint')}
      onAction={props.onCreateClient}
      title={props.t('coach.clients.empty')}
    />
  ) : (
    QueryResult({
      emptyTitle: props.t('coach.clients.empty'),
      error: props.clientsError,
      hasActiveFilter,
      isError: Boolean(props.clientsError),
      isLoading: props.clientsLoading,
      itemCount: vm.items.length,
      onRetry: props.onRetry,
    })
  );
  if (status) {
    return (
      <View>
        <DirectoryHeader
          order={vm.order}
          onOrderChange={vm.setOrder}
          objectiveFilter={vm.objectiveFilter}
          objectives={vm.objectives}
          onObjectiveFilterChange={vm.setObjectiveFilter}
          onSearchValueChange={vm.setSearchValue}
          searchValue={vm.searchValue}
          t={props.t}
        />
        {status}
      </View>
    );
  }
  return renderDirectory(props, vm);
}

function useDirectoryModel(props: Props) {
  const [order, setOrder] = useListContext<ClientSort>('clients.sort', 'name');
  const objectives = readObjectiveOptions(props.clients, props.t);
  const items = useMemo(
    () => buildClientCards(sortClients(props.clients, order), props.searchValue, props.objectiveFilter, props.t),
    [props.clients, props.objectiveFilter, props.searchValue, props.t, order],
  );
  return {
    order,
    setOrder,
    emptyLabel: props.t('coach.clients.empty'),
    items,
    objectiveFilter: props.objectiveFilter,
    objectives,
    searchValue: props.searchValue,
    setObjectiveFilter: props.onObjectiveFilterChange,
    setSearchValue: props.onSearchValueChange,
  };
}

function renderDirectory(props: Props, vm: ReturnType<typeof useDirectoryModel>): React.JSX.Element {
  return (
    <View>
      <DirectoryHeader
        order={vm.order}
        onOrderChange={vm.setOrder}
        objectiveFilter={vm.objectiveFilter}
        objectives={vm.objectives}
        onObjectiveFilterChange={vm.setObjectiveFilter}
        onSearchValueChange={vm.setSearchValue}
        searchValue={vm.searchValue}
        t={props.t}
      />
      <ClientCardRow
        items={vm.items.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.weightLabel ?? '',
          avatarUrl: item.avatarUrl,
          objective: item.objective,
          statusTone: item.statusTone,
          statusLabel:
            item.statusTone === 'success'
              ? props.t('coach.clients.card.planAssigned')
              : props.t('coach.clients.card.planPending'),
        }))}
        onItemPress={props.onSelectClient}
        selectedId={props.selectedClientId}
      />
    </View>
  );
}

function DirectoryHeader(props: {
  order: ClientSort;
  onOrderChange: (order: ClientSort) => void;
  objectiveFilter: string;
  objectives: Array<{ label: string; value: string }>;
  onObjectiveFilterChange: (nextValue: string) => void;
  onSearchValueChange: (nextValue: string) => void;
  searchValue: string;
  t: (key: string) => string;
}): React.JSX.Element {
  const stacked = useBreakpoint() === 'sm';
  return (
    <View style={styles.headerRow}>
      <View style={[styles.filtersRow, stacked && styles.filtersRowStacked]}>
        <SearchInput onChangeText={props.onSearchValueChange} stacked={stacked} t={props.t} value={props.searchValue} />
        <Select
          label={props.t('coach.clients.filters.sort')}
          containerStyle={stacked ? [styles.sortFilter, styles.stackedField] : styles.sortFilter}
          value={props.order}
          onChange={(value) => props.onOrderChange(value as ClientSort)}
          options={[
            { value: 'name', label: props.t('coach.clients.filters.sortName') },
            { value: 'activity', label: props.t('coach.clients.filters.sortActivity') },
          ]}
        />
        <ObjectiveSelect
          stacked={stacked}
          label={props.t('coach.clients.filters.objective')}
          objectiveFilter={props.objectiveFilter}
          objectives={props.objectives}
          onChange={props.onObjectiveFilterChange}
        />
      </View>
    </View>
  );
}

function SearchInput(props: {
  stacked: boolean;
  onChangeText: (nextValue: string) => void;
  t: (key: string) => string;
  value: string;
}): React.JSX.Element {
  return (
    <TextField
      containerStyle={props.stacked ? [styles.searchInput, styles.stackedField] : styles.searchInput}
      onChangeText={props.onChangeText}
      label={props.t('coach.clients.filters.search')}
      placeholder={props.t('coach.clients.filters.searchPlaceholder')}
      value={props.value}
    />
  );
}

function ObjectiveSelect(props: {
  label: string;
  stacked: boolean;
  objectiveFilter: string;
  objectives: Array<{ label: string; value: string }>;
  onChange: (nextValue: string) => void;
}): React.JSX.Element {
  return (
    <Select
      label={props.label}
      containerStyle={props.stacked ? [styles.objectiveFilter, styles.stackedField] : styles.objectiveFilter}
      onChange={props.onChange}
      options={props.objectives}
      value={props.objectiveFilter}
    />
  );
}

function buildClientCards(
  clients: ClientView[],
  searchValue: string,
  objectiveFilter: string,
  t: (key: string) => string,
): ClientSelectorItem[] {
  const search = searchValue.trim();
  return clients.filter((item) => matchesClient(item, search, objectiveFilter)).map((item) => toCard(item, t));
}

function matchesClient(client: ClientView, search: string, objectiveFilter: string): boolean {
  const fullName = `${client.firstName} ${client.lastName}`.trim();
  const objective = (client.objective ?? '').trim();
  const nameMatches = matchesSearch(fullName, search);
  const matchesObjective = objectiveFilter === 'ALL' || objective === objectiveFilter;
  return nameMatches && matchesObjective;
}

function toCard(client: ClientView, t: (key: string) => string): ClientSelectorItem {
  return {
    avatarUrl: client.avatarUrl,
    id: client.id,
    name: `${client.firstName} ${client.lastName}`.trim(),
    objective: readObjective(client, t),
    progressLabel: t('coach.clients.card.progressEmpty'),
    progressTitle: t('coach.clients.card.progress'),
    statusTone: client.trainingPlanId ? 'success' : 'warning',
    weightLabel: readWeightLabel(client.weightKg, t),
    weightTitle: t('coach.clients.card.weight'),
  };
}

function readWeightLabel(weightKg: null | number, t: (key: string) => string): string {
  if (weightKg === null) {
    return t('coach.clients.card.weightEmpty');
  }
  return `${weightKg} kg`;
}

function readObjective(client: ClientView, t: (key: string) => string): string {
  const objective = (client.objective ?? '').trim();
  if (objective.length > 0) {
    return objective;
  }
  return t('coach.clients.card.objectiveEmpty');
}

function readObjectiveOptions(clients: ClientView[], t: (key: string) => string) {
  const labels = Array.from(
    new Set(clients.map((item) => (item.objective ?? '').trim()).filter((value) => value.length > 0)),
  ).sort((left, right) => left.localeCompare(right, 'es'));

  const options = labels.map((label) => ({ label, value: label }));
  return [{ label: t('coach.clients.filters.allObjectives'), value: 'ALL' }, ...options];
}
