import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { ClientView } from '../../../data/hooks/useClientsQuery';
import { ClientSelectionStrip, type ClientSelectorItem } from './ClientSelectionStrip';
import { styles } from './ClientsDirectoryPanel.styles';

type Props = {
  clients: ClientView[];
  clientsError: unknown;
  clientsLoading: boolean;
  onSelectClient: (clientId: string) => void;
  selectedClientId: string;
  t: (key: string) => string;
};

export function ClientsDirectoryPanel(props: Props): React.JSX.Element {
  const vm = useDirectoryModel(props);
  if (props.clientsError) {
    return <Text style={styles.empty}>{props.t('coach.clients.error')}</Text>;
  }
  return renderDirectory(props, vm);
}

function useDirectoryModel(props: Props) {
  const [searchValue, setSearchValue] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState('ALL');
  const objectives = readObjectiveOptions(props.clients, props.t);
  const items = useMemo(
    () => buildClientCards(props.clients, searchValue, objectiveFilter, props.t),
    [objectiveFilter, props.clients, props.t, searchValue],
  );
  const emptyLabel = readEmptyLabel(props.clientsLoading, props.t);
  return {
    emptyLabel,
    items,
    objectiveFilter,
    objectives,
    searchValue,
    setObjectiveFilter,
    setSearchValue,
  };
}

function renderDirectory(
  props: Props,
  vm: ReturnType<typeof useDirectoryModel>,
): React.JSX.Element {
  return (
    <ClientSelectionStrip
      emptyLabel={vm.emptyLabel}
      headerContent={
        <DirectoryHeader
          objectiveFilter={vm.objectiveFilter}
          objectives={vm.objectives}
          onObjectiveFilterChange={vm.setObjectiveFilter}
          onSearchValueChange={vm.setSearchValue}
          searchValue={vm.searchValue}
          t={props.t}
        />
      }
      items={vm.items}
      loading={props.clientsLoading}
      onSelect={props.onSelectClient}
      selectedId={props.selectedClientId}
      showArrows
    />
  );
}

function DirectoryHeader(props: {
  objectiveFilter: string;
  objectives: Array<{ label: string; value: string }>;
  onObjectiveFilterChange: (nextValue: string) => void;
  onSearchValueChange: (nextValue: string) => void;
  searchValue: string;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>{props.t('coach.clients.section.title')}</Text>
      <View style={styles.filtersRow}>
        <SearchInput
          onChangeText={props.onSearchValueChange}
          t={props.t}
          value={props.searchValue}
        />
        <ObjectiveSelect
          objectiveFilter={props.objectiveFilter}
          objectives={props.objectives}
          onChange={props.onObjectiveFilterChange}
        />
      </View>
    </View>
  );
}

function SearchInput(props: {
  onChangeText: (nextValue: string) => void;
  t: (key: string) => string;
  value: string;
}): React.JSX.Element {
  return (
    <TextInput
      onChangeText={props.onChangeText}
      placeholder={props.t('coach.clients.filters.searchPlaceholder')}
      style={styles.searchInput}
      value={props.value}
    />
  );
}

function ObjectiveSelect(props: {
  objectiveFilter: string;
  objectives: Array<{ label: string; value: string }>;
  onChange: (nextValue: string) => void;
}): React.JSX.Element {
  return (
    <select
      onChange={(event) => props.onChange(event.target.value)}
      style={styles.objectiveFilter as React.CSSProperties}
      value={props.objectiveFilter}
    >
      {props.objectives.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function readEmptyLabel(isLoading: boolean, t: (key: string) => string): string {
  return isLoading ? t('coach.clients.loading') : t('coach.clients.empty');
}

function buildClientCards(
  clients: ClientView[],
  searchValue: string,
  objectiveFilter: string,
  t: (key: string) => string,
): ClientSelectorItem[] {
  const search = searchValue.trim().toLocaleLowerCase('es');
  return clients
    .filter((item) => matchesClient(item, search, objectiveFilter))
    .map((item) => toCard(item, t))
    .sort((left, right) => left.name.localeCompare(right.name, 'es'));
}

function matchesClient(client: ClientView, search: string, objectiveFilter: string): boolean {
  const fullName = `${client.firstName} ${client.lastName}`.trim().toLocaleLowerCase('es');
  const objective = (client.objective ?? '').trim();
  const matchesSearch = search.length === 0 || fullName.includes(search);
  const matchesObjective = objectiveFilter === 'ALL' || objective === objectiveFilter;
  return matchesSearch && matchesObjective;
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
    new Set(
      clients.map((item) => (item.objective ?? '').trim()).filter((value) => value.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, 'es'));

  const options = labels.map((label) => ({ label, value: label }));
  return [{ label: t('coach.clients.filters.allObjectives'), value: 'ALL' }, ...options];
}
