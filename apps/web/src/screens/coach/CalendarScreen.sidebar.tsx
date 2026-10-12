import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { matchesSearch } from '../../utils/normalize-search';
import { ChevronLeft, Dumbbell, Search, Users } from 'lucide-react';
import type { ClientObjectiveView, ClientView } from '../../data/hooks/useClientsQuery';
import type { RoutineDayCard } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';
import { Button, EmptyState, Select, colors as tk, fontSize, radius, space, useBreakpoint } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

const EMPTY_FILTER = '';
const SIDEBAR_STACKED_HEIGHT = 340;

const colors = {
  primary: tk.primary,
  text: tk.text,
  textMuted: tk.textMuted,
  border: tk.border,
  bg: tk.surfaceMuted,
};

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
  return (
    <View style={{ padding: space.xl, borderBottomWidth: 1, borderColor: colors.border, flexShrink: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.md }}>
        <View style={{ marginRight: space.sm, backgroundColor: tk.primarySoft, padding: space.sm, borderRadius: radius.md }}>
          <Users color={colors.primary} size={18} />
        </View>
        <Text style={{ fontSize: fontSize.md, fontWeight: 'bold', color: colors.text }}>
          {t('coach.calendar.sidebar.clients')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: space.md,
          marginBottom: space.sm,
        }}
      >
        <Search color={colors.textMuted} size={15} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t('coach.calendar.sidebar.search')}
          style={{ flex: 1, padding: space.sm, fontSize: fontSize.sm, color: colors.text }}
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
          icon={<ChevronLeft color={colors.textMuted} size={14} />}
          label={t('coach.calendar.sidebar.back')}
          onPress={() => (selectedClient ? onSelectClient(null) : onAllView())}
          size={SIZE_SM}
          style={{ marginTop: space.md }}
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
  return (
    <View style={{ marginBottom: space.xs }}>
      <Pressable
        onPress={() => onSelectClient(isSelected ? null : client)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: space.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : 'transparent',
          backgroundColor: isSelected ? tk.primarySoft : 'transparent',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: tk.border,
            overflow: 'hidden',
            marginRight: space.md,
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {client.avatarUrl ? (
            <img
              src={client.avatarUrl}
              alt={client.firstName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: colors.textMuted }}>
              {client.firstName.charAt(0)}
              {client.lastName.charAt(0)}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: isSelected ? colors.primary : colors.text }}
            numberOfLines={1}
          >
            {client.firstName} {client.lastName}
          </Text>
          {objective && (
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }} numberOfLines={1}>
              {objective.label}
            </Text>
          )}
        </View>
      </Pressable>
      {isSelected && routineDays.length > 0 && (
        <View style={{ paddingLeft: space.xs, paddingRight: space.xs, marginTop: space.sm }}>
          <Text
            style={{
              fontSize: fontSize.xs,
              fontWeight: 'bold',
              color: colors.textMuted,
              letterSpacing: 0.5,
              marginBottom: space.sm,
              textTransform: 'uppercase',
            }}
          >
            {t('coach.calendar.sidebar.assignedRoutine')}
          </Text>
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

type CoachViewItemProps = { isActive: boolean; label: string; onPress: () => void };
function CoachViewItem({ isActive, label, onPress }: CoachViewItemProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: space.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: isActive ? colors.primary : 'transparent',
        backgroundColor: isActive ? tk.primarySoft : 'transparent',
        marginBottom: space.sm,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isActive ? tk.primaryBorder : tk.border,
          marginRight: space.md,
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Dumbbell size={16} color={isActive ? colors.primary : colors.textMuted} />
      </View>
      <Text style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: isActive ? colors.primary : colors.text }}>
        {label}
      </Text>
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

  return (
    <View
      style={{
        width: stacked ? '100%' : 300,
        height: stacked ? SIDEBAR_STACKED_HEIGHT : undefined,
        backgroundColor: 'white',
        borderRightWidth: stacked ? 0 : 1,
        borderBottomWidth: stacked ? 1 : 0,
        borderColor: colors.border,
        flexDirection: 'column',
        alignSelf: 'stretch',
        flexShrink: 0,
      }}
    >
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
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: space.md }}>
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
        {filtered.length === 0 && <EmptyState title={t('coach.calendar.sidebar.noClients')} />}
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
  const colorObj = (CALENDAR_COLORS.find((c) => c.bg === day.color) ?? CALENDAR_COLORS[0])!;

  return (
    <div
      draggable
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('planDayId', day.id);
        e.dataTransfer.setData('planDayTitle', day.title);
        e.dataTransfer.setData('clientId', clientId);
        e.dataTransfer.setData('color', day.color);
      }}
      style={{
        position: 'relative',
        padding: '10px 12px',
        borderRadius: radius.md,
        border: `1px solid ${colorObj.border}`,
        backgroundColor: colorObj.bg,
        marginBottom: space.sm,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: colorObj.text, margin: 0 }}>{day.title}</p>
          <p style={{ fontSize: fontSize.xs, color: colorObj.text, opacity: 0.7, margin: '2px 0 0' }}>
            {day.exerciseCount} {t('coach.calendar.sidebar.exercises')}
          </p>
        </div>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleColorPicker();
          }}
          style={{
            width: 16,
            height: 16,
            borderRadius: radius.md,
            border: '2px solid white',
            backgroundColor: colorObj.bg,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: `0 0 0 1px ${colorObj.border}`,
          }}
        />
      </div>
      {isColorPickerOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 32,
            backgroundColor: 'white',
            borderRadius: radius.md,
            padding: space.sm,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: `1px solid ${tk.border}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: space.sm,
            zIndex: 50,
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {CALENDAR_COLORS.map((c) => (
            <button
              key={c.bg}
              onClick={() => onColorChange(c.bg)}
              style={{
                width: 22,
                height: 22,
                borderRadius: radius.md,
                backgroundColor: c.bg,
                border: day.color === c.bg ? `2px solid ${tk.text}` : '2px solid white',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
