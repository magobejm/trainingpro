import { routineDayBody } from './CalendarScreen.sidebar.layout-styles';
import { getColorForHex } from './calendar-screen.utils';
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
  getLayoutStyle15,
  getLayoutStyle16,
  getLayoutStyle17,
  getLayoutStyle18,
  getLayoutStyle19,
  getLayoutStyle20,
  getLayoutStyle21,
  getLayoutStyle22,
  getLayoutStyle23,
  getLayoutStyle24,
  getLayoutStyle25,
  getLayoutStyle26,
  getLayoutStyle27,
  getLayoutStyle28,
  getLayoutStyle29,
  getLayoutStyle30,
} from './CalendarScreen.sidebar.layout-styles';

import { WebBox, WebText } from '@trainerpro/ui';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { matchesSearch } from '../../utils/normalize-search';
import { ChevronLeft, Dumbbell, Search, Users } from 'lucide-react';
import type { ClientObjectiveView, ClientView } from '../../data/hooks/useClientsQuery';
import type { RoutineDayCard } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';
import { Button, EmptyState, IconButton, Select, StatusDot, TextField, colors as tk, useBreakpoint } from '@trainerpro/ui';
import { clientStatusDot } from './client-card-items';
import { EmptyIllustration } from '../../components/EmptyIllustrations';
const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;
const EMPTY_FILTER = '';
const SIDEBAR_STACKED_HEIGHT = 520;
const nameRow = { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 8 };
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
type ViewMode = 'all' | 'coachOnly';
type SidebarProps = {
  clients: ClientView[];
  objectives: ClientObjectiveView[];
  selectedClient: ClientView | null;
  onSelectClient: (client: ClientView | null) => void;
  viewMode: ViewMode;
  onCoachOnlyView: () => void;
  onAllView: () => void;
  routineDays: RoutineDayCard[];
  onRoutineDayColorChange: (dayId: string, color: string) => void;
  t: TFunc;
};
type SidebarHeaderProps = {
  search: string;
  onSearchChange: (v: string) => void;
  objectiveFilter: string;
  onObjectiveFilterChange: (v: string) => void;
  objectives: ClientObjectiveView[];
  selectedClient: ClientView | null;
  onSelectClient: (client: ClientView | null) => void;
  viewMode: ViewMode;
  onAllView: () => void;
  t: TFunc;
};
function SidebarHeader({
  search,
  onSearchChange,
  objectiveFilter,
  onObjectiveFilterChange,
  objectives,
  selectedClient,
  onSelectClient,
  viewMode,
  onAllView,
  t,
}: SidebarHeaderProps): React.JSX.Element {
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3;
  const layoutStyle4 = getLayoutStyle4;
  const layoutStyle5 = getLayoutStyle5;
  const layoutStyle6 = getLayoutStyle6;
  const layoutStyle7 = getLayoutStyle7;
  return (
    <View style={layoutStyle1}>
      <View style={layoutStyle2}>
        <View style={layoutStyle3}>
          <Users color={tk.primary} size={18} />
        </View>
        <Text style={layoutStyle4}>{t('coach.calendar.sidebar.clients')}</Text>
      </View>
      <View style={layoutStyle5}>
        <Search color={tk.textMuted} size={15} />
        <TextField
          value={search}
          onChangeText={onSearchChange}
          placeholder={t('coach.calendar.sidebar.search')}
          containerStyle={layoutStyle6}
        />
      </View>
      <Select
        label={t('coach.calendar.sidebar.objectiveFilter')}
        onChange={onObjectiveFilterChange}
        options={[
          { label: t('coach.calendar.sidebar.allObjectives'), value: EMPTY_FILTER },
          ...objectives.map((obj) => ({ label: obj.label, value: obj.id })),
        ]}
        value={objectiveFilter}
      />
      {(selectedClient || viewMode === 'coachOnly') && (
        <Button
          icon={<ChevronLeft color={tk.textMuted} size={14} />}
          label={t('coach.calendar.sidebar.back')}
          onPress={() => (selectedClient ? onSelectClient(null) : onAllView())}
          size={SIZE_SM}
          style={layoutStyle7}
          variant={VARIANT_SECONDARY}
        />
      )}
    </View>
  );
}
type SidebarClientRowProps = {
  client: ClientView;
  objective: ClientObjectiveView | undefined;
  isSelected: boolean;
  routineDays: RoutineDayCard[];
  activeColorPicker: string | null;
  onSelectClient: (client: ClientView | null) => void;
  onRoutineDayColorChange: (dayId: string, color: string) => void;
  onSetActiveColorPicker: (id: string | null) => void;
  t: TFunc;
};
function SidebarClientRow({
  client,
  objective,
  isSelected,
  routineDays,
  activeColorPicker,
  onSelectClient,
  onRoutineDayColorChange,
  onSetActiveColorPicker,
  t,
}: SidebarClientRowProps): React.JSX.Element {
  const layoutStyle8 = getLayoutStyle8;
  const layoutStyle9 = getLayoutStyle9(isSelected ? tk.primary : 'transparent', isSelected ? tk.primarySoft : 'transparent');
  const layoutStyle10 = getLayoutStyle10;
  const layoutStyle11 = getLayoutStyle11;
  const layoutStyle12 = getLayoutStyle12;
  const layoutStyle13 = getLayoutStyle13;
  const layoutStyle14 = getLayoutStyle14(isSelected ? tk.primary : tk.text);
  const layoutStyle15 = getLayoutStyle15;
  const layoutStyle16 = getLayoutStyle16;
  const layoutStyle17 = getLayoutStyle17;
  const statusDot = clientStatusDot(client, t);
  return (
    <View style={layoutStyle8}>
      <Pressable onPress={() => onSelectClient(isSelected ? null : client)} style={layoutStyle9}>
        <View style={layoutStyle10}>
          {client.avatarUrl ? (
            <Image source={{ uri: client.avatarUrl }} accessibilityLabel={client.firstName} style={layoutStyle11} />
          ) : (
            <Text style={layoutStyle12}>
              {client.firstName.charAt(0)}
              {client.lastName.charAt(0)}
            </Text>
          )}
        </View>
        <View style={layoutStyle13}>
          <View style={nameRow}>
            <Text style={layoutStyle14} numberOfLines={1}>
              {client.firstName} {client.lastName}
            </Text>
            {statusDot ? <StatusDot align={'center'} reason={statusDot.reason} tone={statusDot.tone} /> : null}
          </View>
          {objective && (
            <Text style={layoutStyle15} numberOfLines={1}>
              {objective.label}
            </Text>
          )}
        </View>
      </Pressable>
      {isSelected && routineDays.length > 0 && (
        <View style={layoutStyle16}>
          <Text style={layoutStyle17}>{t('coach.calendar.sidebar.assignedRoutine')}</Text>
          {routineDays.map((day) => (
            <RoutineDayItem
              key={day.id}
              day={day}
              clientId={client.id}
              isColorPickerOpen={activeColorPicker === day.id}
              onToggleColorPicker={() => onSetActiveColorPicker(activeColorPicker === day.id ? null : day.id)}
              onColorChange={(color) => {
                onRoutineDayColorChange(day.id, color);
                onSetActiveColorPicker(null);
              }}
              t={t}
            />
          ))}
        </View>
      )}
    </View>
  );
}
type CoachViewItemProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};
function CoachViewItem({ isActive, label, onPress }: CoachViewItemProps): React.JSX.Element {
  const layoutStyle18 = getLayoutStyle18(isActive ? tk.primary : 'transparent', isActive ? tk.primarySoft : 'transparent');
  const layoutStyle19 = getLayoutStyle19(isActive ? tk.primaryBorder : tk.border);
  const layoutStyle20 = getLayoutStyle20(isActive ? tk.primary : tk.text);
  return (
    <Pressable onPress={onPress} style={layoutStyle18}>
      <View style={layoutStyle19}>
        <Dumbbell size={16} color={isActive ? tk.primary : tk.textMuted} />
      </View>
      <Text style={layoutStyle20}>{label}</Text>
    </Pressable>
  );
}
export function CalendarSidebar({
  clients,
  objectives,
  selectedClient,
  onSelectClient,
  viewMode,
  onCoachOnlyView,
  onAllView,
  routineDays,
  onRoutineDayColorChange,
  t,
}: SidebarProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState<string>(EMPTY_FILTER);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const isCoachOnly = viewMode === 'coachOnly';
  const stacked = useBreakpoint() === 'sm';
  const filtered = clients.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`;
    const nameMatches = matchesSearch(fullName, search);
    const matchesObj = objectiveFilter ? c.objectiveId === objectiveFilter : true;
    return nameMatches && matchesObj;
  });
  const layoutStyle21 = getLayoutStyle21(
    stacked ? '100%' : 300,
    stacked ? SIDEBAR_STACKED_HEIGHT : undefined,
    stacked ? 0 : 1,
    stacked ? 1 : 0,
  );
  const layoutStyle22 = getLayoutStyle22;
  const layoutStyle23 = getLayoutStyle23;
  return (
    <View style={layoutStyle21}>
      <SidebarHeader
        search={search}
        onSearchChange={setSearch}
        objectiveFilter={objectiveFilter}
        onObjectiveFilterChange={setObjectiveFilter}
        objectives={objectives}
        selectedClient={selectedClient}
        onSelectClient={onSelectClient}
        viewMode={viewMode}
        onAllView={onAllView}
        t={t}
      />
      <ScrollView style={layoutStyle22} contentContainerStyle={layoutStyle23}>
        <CoachViewItem
          isActive={isCoachOnly}
          label={t('coach.calendar.sidebar.coachView')}
          onPress={() => (isCoachOnly ? onAllView() : onCoachOnlyView())}
        />
        {filtered.map((client) => (
          <SidebarClientRow
            key={client.id}
            client={client}
            objective={objectives.find((o) => o.id === client.objectiveId)}
            isSelected={selectedClient?.id === client.id}
            routineDays={routineDays}
            activeColorPicker={activeColorPicker}
            onSelectClient={onSelectClient}
            onRoutineDayColorChange={onRoutineDayColorChange}
            onSetActiveColorPicker={setActiveColorPicker}
            t={t}
          />
        ))}
        {filtered.length === 0 && (
          <EmptyState
            icon={<EmptyIllustration kind={'calendar'} />}
            message={t('coach.calendar.sidebar.emptyInvite')}
            title={t('coach.calendar.sidebar.noClients')}
          />
        )}
      </ScrollView>
    </View>
  );
}
type RoutineDayItemProps = {
  day: RoutineDayCard;
  clientId: string;
  isColorPickerOpen: boolean;
  onToggleColorPicker: () => void;
  onColorChange: (color: string) => void;
  t: TFunc;
};
function RoutineDayItem({
  day,
  clientId,
  isColorPickerOpen,
  onToggleColorPicker,
  onColorChange,
  t,
}: RoutineDayItemProps): React.JSX.Element {
  const colorObj = getColorForHex(day.color);
  const layoutStyle24 = getLayoutStyle24(`1px solid ${colorObj.border}`, colorObj.bg);
  const layoutStyle25 = getLayoutStyle25;
  const layoutStyle26 = getLayoutStyle26(colorObj.text);
  const layoutStyle27 = getLayoutStyle27(colorObj.text);
  const layoutStyle29 = getLayoutStyle28;
  return (
    <WebBox
      draggable
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('planDayId', day.id);
        e.dataTransfer.setData('planDayTitle', day.title);
        e.dataTransfer.setData('clientId', clientId);
        e.dataTransfer.setData('color', day.color);
      }}
      style={layoutStyle24}
    >
      <WebBox style={layoutStyle25}>
        <WebBox style={routineDayBody}>
          <WebText style={layoutStyle26}>{day.title}</WebText>
          <WebText style={layoutStyle27}>
            {day.exerciseCount} {t('coach.calendar.sidebar.exercises')}
          </WebText>
        </WebBox>
        <IconButton
          accessibilityLabel={t('coach.calendar.sidebar.changeColor')}
          icon={() => {
            const layoutStyle28 = getLayoutStyle29(colorObj.bg);
            return <View style={layoutStyle28} />;
          }}
          onPress={onToggleColorPicker}
          size={28}
        />
      </WebBox>
      {isColorPickerOpen && (
        <WebBox style={layoutStyle29} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {CALENDAR_COLORS.map((c) => {
            const layoutStyle30 = getLayoutStyle30(
              c.bg,
              colorObj.bg === c.bg ? 2 : 1,
              colorObj.bg === c.bg ? tk.text : c.border,
            );
            return (
              <IconButton
                key={c.bg}
                accessibilityLabel={t('coach.calendar.sidebar.selectColor', { color: c.text })}
                icon={() => <View style={layoutStyle30} />}
                onPress={() => onColorChange(c.bg)}
                size={28}
              />
            );
          })}
        </WebBox>
      )}
    </WebBox>
  );
}
