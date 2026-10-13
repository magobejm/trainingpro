import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { StyleSheet } from 'react-native';
import {
  getLayoutStyle1,
  getLayoutStyle2,
  getLayoutStyle3,
  getLayoutStyle4,
  getLayoutStyle5,
  getLayoutStyle6,
  getLayoutStyle7,
  getLayoutStyle8,
  getLayoutStyle9,
  getLayoutStyle10,
  getLayoutStyle11,
  getLayoutStyle12,
  getLayoutStyle13,
  getLayoutStyle14,
  getLayoutStyle16,
  getLayoutStyle17,
  getLayoutStyle18,
  getLayoutStyle19,
  getLayoutStyle20,
  getLayoutStyle21,
  getLayoutStyle22,
} from './NotesScreen.client-section.layout-styles';

import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Users } from 'lucide-react';
import type { ClientData } from './notes-screen.types';
import { Button, EmptyState, TextField, colors, fontSize, radius, space, useBreakpoint } from '@trainerpro/ui';
const ICON_USER = '👤' as const;
export type ClientNoteSectionProps = {
  objectives: {
    id: string;
    label: string;
  }[];
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
  const stacked = useBreakpoint() === 'sm';
  const layoutStyle1 = getLayoutStyle1(stacked ? 'column' : 'row');
  return (
    <View>
      <ClientSectionHeader t={props.t} />
      <View style={layoutStyle1}>
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
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3;
  const layoutStyle4 = getLayoutStyle4;
  return (
    <View style={layoutStyle2}>
      <View style={layoutStyle3}>
        <Users color={colors.textMuted} size={20} />
      </View>
      <Text style={layoutStyle4}>{props.t('coach.notes.client.title')}</Text>
    </View>
  );
}
function ClientSelectionPane(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  const layoutStyle5 = getLayoutStyle5;
  const layoutStyle6 = getLayoutStyle6;
  const layoutStyle7 = getLayoutStyle7;
  return (
    <View style={layoutStyle5}>
      <TextField
        containerStyle={layoutStyle6}
        onChangeText={vm.setClientSearch}
        placeholder={vm.t('coach.notes.client.search')}
        value={vm.clientSearch}
      />
      <ObjectiveFilterChips vm={vm} />
      {(vm.clientSearch || vm.selectedObjectiveLabel) && (
        <ScrollView style={layoutStyle7}>
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
  const layoutStyle8 = getLayoutStyle8;
  const layoutStyle9 = getLayoutStyle9;
  const layoutStyle10 = getLayoutStyle10;
  return (
    <View style={layoutStyle8}>
      <Text style={layoutStyle9}>{vm.t('coach.notes.client.filterByObjective')}</Text>
      <View style={layoutStyle10}>
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
  objective:
    | {
        id: string;
        label: string;
      }
    | undefined;
  onSelect: (c: ClientData) => void;
}): React.JSX.Element {
  const layoutStyle11 = getLayoutStyle11;
  const layoutStyle12 = getLayoutStyle12;
  const layoutStyle13 = getLayoutStyle13;
  const layoutStyle14 = getLayoutStyle14;
  return (
    <View style={clientCardStyle(props.isSelected)}>
      <Pressable onPress={() => props.onSelect(props.client)}>
        <View style={layoutStyle11}>
          <AvatarCell client={props.client} />
          <View style={layoutStyle12}>
            <Text style={layoutStyle13}>
              {props.client.firstName} {props.client.lastName}
            </Text>
            {props.objective && (
              <View style={clientObjectiveBadgeStyle}>
                <Text style={layoutStyle14}>{props.objective.label}</Text>
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
  const layoutStyle16 = getLayoutStyle16;
  return (
    <View style={avatarWrapStyle(client.avatarUrl)}>
      {client.avatarUrl ? (
        <Image
          source={{ uri: client.avatarUrl }}
          accessibilityLabel={`${client.firstName} ${client.lastName}`}
          style={clientImageStyle}
        />
      ) : (
        <Text style={layoutStyle16}>{ICON_USER}</Text>
      )}
    </View>
  );
}
function SelectedDot(): React.JSX.Element {
  const layoutStyle17 = getLayoutStyle17;
  return <View style={layoutStyle17} />;
}
function ClientEditorPane(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  const layoutStyle18 = getLayoutStyle18;
  return (
    <View style={layoutStyle18}>{vm.selectedClient ? <ClientEditorCard vm={vm} /> : <ClientEmptyState vm={vm} />}</View>
  );
}
function ClientEditorCard(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  const vm = props.vm;
  const selectedClient = vm.selectedClient!;
  const layoutStyle19 = getLayoutStyle19;
  const layoutStyle20 = getLayoutStyle20;
  const layoutStyle21 = getLayoutStyle21;
  const layoutStyle22 = getLayoutStyle22;
  return (
    <View style={clientEditorCardStyle}>
      <View style={layoutStyle19}>
        <Text style={layoutStyle20}>{vm.t('coach.notes.client.newEntry', { name: selectedClient.firstName })}</Text>
      </View>
      <View style={layoutStyle21}>
        <TextField
          accessibilityLabel={vm.t('coach.notes.client.newEntry', { name: selectedClient.firstName })}
          multiline
          numberOfLines={10}
          onChangeText={vm.setClientNoteText}
          placeholder={vm.t('coach.notes.client.placeholder', { name: selectedClient.firstName })}
          value={vm.clientNoteText}
        />
      </View>
      <View style={layoutStyle22}>
        <Button label={vm.t('coach.notes.client.register')} loading={vm.isSaving} onPress={vm.onSave} />
      </View>
    </View>
  );
}
function ClientEmptyState(props: { vm: ClientSectionViewModel }): React.JSX.Element {
  return (
    <View style={clientEmptyStateStyle}>
      <EmptyState icon={<EmptyIllustration kind={'generic'} />} title={props.vm.t('coach.notes.client.selectPrompt')} />
    </View>
  );
}
function objectiveChipStyle(active: boolean) {
  return {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: active ? colors.primary : colors.background,
    margin: space.xs,
  };
}
function objectiveChipLabelStyle(active: boolean) {
  return {
    fontSize: fontSize.xs,
    fontWeight: 'bold' as const,
    color: active ? colors.surface : colors.textMuted,
  };
}
function clientCardStyle(selected: boolean) {
  return {
    backgroundColor: selected ? colors.primarySoft : colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: selected ? colors.primary : colors.border,
    marginBottom: space.md,
    overflow: 'hidden' as const,
    shadowColor: colors.shadowColor,
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
  backgroundColor: colors.surface,
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

const clientImageStyle = StyleSheet.create({ image: { width: 40, height: 40, borderRadius: radius.pill } }).image;
