import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Users } from 'lucide-react';
import type { ClientData } from './notes-screen.types';

const theme = {
  colors: {
    primary: '#3b82f6',
    text: '#0f172a',
    textMuted: '#64748b',
  },
};

const ICON_USER = '👤' as const;

export type ClientNoteSectionProps = {
  objectives: { id: string; label: string }[];
  filteredClients: ClientData[];
  clientSearch: string;
  setClientSearch: (v: string) => void;
  selectedObjective: string;
  setSelectedObjective: (v: string) => void;
  selectedClient: ClientData | null;
  setSelectedClient: (c: ClientData) => void;
  clientNoteText: string;
  setClientNoteText: (v: string) => void;
  onSave: () => void;
  t: (k: string, opts?: Record<string, unknown>) => string;
};

type ClientSectionViewModel = ClientNoteSectionProps & {
  selectedObjectiveLabel: string;
};

export function ClientNoteSection(props: ClientNoteSectionProps): React.JSX.Element {
  const vm = useClientNoteSectionModel(props);
  return (
    <View>
      <ClientSectionHeader t={props.t} />
      <View style={{ flexDirection: 'row', marginHorizontal: -12 }}>
        <ClientSelectionPane vm={vm} />
        <ClientEditorPane vm={vm} />
      </View>
    </View>
  );
}

function useClientNoteSectionModel(props: ClientNoteSectionProps): ClientSectionViewModel {
  return { ...props, selectedObjectiveLabel: props.selectedObjective };
}

function ClientSectionHeader(props: { t: (k: string, opts?: Record<string, unknown>) => string }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <View style={{ marginRight: 8 }}>
        <Users color={theme.colors.textMuted} size={20} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
        {props.t('coach.notes.client.title')}
      </Text>
    </View>
  );
}

function ClientSelectionPane(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={{ flex: 1, paddingHorizontal: 12 }}>
      <TextInput
        value={vm.clientSearch}
        onChangeText={vm.setClientSearch}
        placeholder={vm.t('coach.notes.client.search')}
        style={clientSearchInputStyle}
      />
      <ObjectiveFilterChips vm={vm} />
      {(vm.clientSearch || vm.selectedObjectiveLabel) && (
        <ScrollView style={{ maxHeight: 400 }}>
          {vm.filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              isSelected={vm.selectedClient?.id === client.id}
              objective={vm.objectives.find((item) => item.id === client.objectiveId)}
              onSelect={vm.setSelectedClient}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ObjectiveFilterChips(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 }}>
        {vm.t('coach.notes.client.filterByObjective')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
        <ObjectiveChip
          active={!vm.selectedObjectiveLabel}
          label={vm.t('coach.notes.client.all')}
          onPress={() => vm.setSelectedObjective('')}
        />
        {vm.objectives.map((obj) => (
          <ObjectiveChip
            key={obj.id}
            active={vm.selectedObjectiveLabel === obj.id}
            label={obj.label}
            onPress={() => vm.setSelectedObjective(obj.id)}
          />
        ))}
      </View>
    </View>
  );
}

function ObjectiveChip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={objectiveChipStyle(props.active)}>
      <Text style={objectiveChipLabelStyle(props.active)}>{props.label}</Text>
    </Pressable>
  );
}

function ClientCard(props: {
  client: ClientData;
  isSelected: boolean;
  objective: { id: string; label: string } | undefined;
  onSelect: (c: ClientData) => void;
}): React.JSX.Element {
  return (
    <View style={clientCardStyle(props.isSelected)}>
      <Pressable onPress={() => props.onSelect(props.client)}>
        <View style={{ flexDirection: 'row', padding: 16, alignItems: 'center' }}>
          <AvatarCell client={props.client} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginBottom: 4 }}>
              {props.client.firstName} {props.client.lastName}
            </Text>
            {props.objective && (
              <View style={clientObjectiveBadgeStyle}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.colors.textMuted }}>
                  {props.objective.label}
                </Text>
              </View>
            )}
          </View>
          {props.isSelected ? <SelectedDot /> : null}
        </View>
      </Pressable>
    </View>
  );
}

function AvatarCell(props: { client: ClientData }): React.JSX.Element {
  const client = props.client;
  return (
    <View style={avatarWrapStyle(client.avatarUrl)}>
      {client.avatarUrl ? (
        <img
          src={client.avatarUrl}
          alt={`${client.firstName} ${client.lastName}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Text style={{ fontSize: 20 }}>{ICON_USER}</Text>
      )}
    </View>
  );
}

function SelectedDot(): React.JSX.Element {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginLeft: 8 }} />;
}

function ClientEditorPane(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  return <View style={{ flex: 2 }}>{vm.selectedClient ? <ClientEditorCard vm={vm} /> : <ClientEmptyState vm={vm} />}</View>;
}

function ClientEditorCard(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  const selectedClient = vm.selectedClient!;
  return (
    <View style={clientEditorCardStyle}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>
          {vm.t('coach.notes.client.newEntry', { name: selectedClient.firstName })}
        </Text>
      </View>
      <TextInput
        value={vm.clientNoteText}
        onChangeText={vm.setClientNoteText}
        placeholder={vm.t('coach.notes.client.placeholder', { name: selectedClient.firstName })}
        multiline
        style={{ flex: 1, padding: 24, minHeight: 250, fontSize: 16, color: theme.colors.text }}
      />
      <View
        style={{ padding: 16, borderTopWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'flex-end' }}
      >
        <Pressable onPress={vm.onSave} style={primaryButtonStyle}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{vm.t('coach.notes.client.register')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ClientEmptyState(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  return (
    <View style={clientEmptyStateStyle}>
      <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
        {props.vm.t('coach.notes.client.selectPrompt')}
      </Text>
    </View>
  );
}

const clientSearchInputStyle = {
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: '#e2e8f0',
  borderRadius: 12,
  padding: 16,
  fontSize: 14,
  marginBottom: 16,
};

function objectiveChipStyle(active: boolean) {
  return {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: active ? theme.colors.primary : '#f1f5f9',
    margin: 4,
  };
}

function objectiveChipLabelStyle(active: boolean) {
  return {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: active ? 'white' : theme.colors.textMuted,
  };
}

function clientCardStyle(selected: boolean) {
  return {
    backgroundColor: selected ? '#eff6ff' : 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: selected ? '#3b82f6' : '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  };
}

const clientObjectiveBadgeStyle = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  backgroundColor: '#f1f5f9',
  alignSelf: 'flex-start' as const,
};

function avatarWrapStyle(avatarUrl: null | string) {
  return {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: avatarUrl ? 'transparent' : '#e2e8f0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    marginRight: 12,
  };
}

const clientEditorCardStyle = {
  backgroundColor: 'white',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
  minHeight: 400,
  overflow: 'hidden' as const,
};

const primaryButtonStyle = {
  backgroundColor: theme.colors.primary,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12,
};

const clientEmptyStateStyle = {
  backgroundColor: '#f8fafc',
  borderRadius: 16,
  borderWidth: 2,
  borderStyle: 'dashed' as const,
  borderColor: '#cbd5e1',
  minHeight: 400,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  padding: 32,
};
