import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Users } from 'lucide-react';
import type { ClientData } from './notes-screen.types';
import { Button, EmptyState, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const theme = {
  colors: {
    primary: colors.primary,
    text: colors.text,
    textMuted: colors.textMuted,
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
  isSaving?: boolean;
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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
      <View style={{ marginRight: space.sm }}>
        <Users color={theme.colors.textMuted} size={20} />
      </View>
      <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: theme.colors.text }}>
        {props.t('coach.notes.client.title')}
      </Text>
    </View>
  );
}

function ClientSelectionPane(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={{ flex: 1, paddingHorizontal: space.md }}>
      <TextField
        containerStyle={{ marginBottom: space.lg }}
        onChangeText={vm.setClientSearch}
        placeholder={vm.t('coach.notes.client.search')}
        value={vm.clientSearch}
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
    <View style={{ marginBottom: space.lg }}>
      <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: theme.colors.text, marginBottom: space.sm }}>
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
        <View style={{ flexDirection: 'row', padding: space.lg, alignItems: 'center' }}>
          <AvatarCell client={props.client} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: 'bold', color: theme.colors.text, marginBottom: space.xs }}>
              {props.client.firstName} {props.client.lastName}
            </Text>
            {props.objective && (
              <View style={clientObjectiveBadgeStyle}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: theme.colors.textMuted }}>
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
        <Text style={{ fontSize: fontSize.xl }}>{ICON_USER}</Text>
      )}
    </View>
  );
}

function SelectedDot(): React.JSX.Element {
  return (
    <View
      style={{ width: 8, height: 8, borderRadius: radius.sm, backgroundColor: theme.colors.primary, marginLeft: space.sm }}
    />
  );
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
      <View style={{ padding: space.lg, borderBottomWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: fontSize.md, fontWeight: 'bold', color: theme.colors.text }}>
          {vm.t('coach.notes.client.newEntry', { name: selectedClient.firstName })}
        </Text>
      </View>
      <View style={{ flex: 1, padding: space.lg }}>
        <TextField
          accessibilityLabel={vm.t('coach.notes.client.newEntry', { name: selectedClient.firstName })}
          multiline
          numberOfLines={10}
          onChangeText={vm.setClientNoteText}
          placeholder={vm.t('coach.notes.client.placeholder', { name: selectedClient.firstName })}
          value={vm.clientNoteText}
        />
      </View>
      <View
        style={{
          padding: space.lg,
          borderTopWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <Button label={vm.t('coach.notes.client.register')} loading={vm.isSaving} onPress={vm.onSave} />
      </View>
    </View>
  );
}

function ClientEmptyState(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  return (
    <View style={clientEmptyStateStyle}>
      <EmptyState title={props.vm.t('coach.notes.client.selectPrompt')} />
    </View>
  );
}

function objectiveChipStyle(active: boolean) {
  return {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: active ? theme.colors.primary : colors.background,
    margin: space.xs,
  };
}

function objectiveChipLabelStyle(active: boolean) {
  return {
    fontSize: fontSize.xs,
    fontWeight: 'bold' as const,
    color: active ? 'white' : theme.colors.textMuted,
  };
}

function clientCardStyle(selected: boolean) {
  return {
    backgroundColor: selected ? colors.primarySoft : 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: selected ? colors.primary : colors.border,
    marginBottom: space.md,
    overflow: 'hidden' as const,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  };
}

const clientObjectiveBadgeStyle = {
  paddingHorizontal: space.sm,
  paddingVertical: space.xs,
  borderRadius: radius.sm,
  backgroundColor: colors.background,
  alignSelf: 'flex-start' as const,
};

function avatarWrapStyle(avatarUrl: null | string) {
  return {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: avatarUrl ? 'transparent' : colors.border,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    marginRight: space.md,
  };
}

const clientEditorCardStyle = {
  backgroundColor: 'white',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  minHeight: 400,
  overflow: 'hidden' as const,
};

const clientEmptyStateStyle = {
  backgroundColor: colors.surfaceMuted,
  borderRadius: 16,
  borderWidth: 2,
  borderStyle: 'dashed' as const,
  borderColor: colors.borderStrong,
  minHeight: 400,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  padding: space.xxl,
};
