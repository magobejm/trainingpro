import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock } from 'lucide-react';
import type { ClientData, NoteData } from './notes-screen.types';
import { formatNoteDate } from './notes-screen.utils';
import { Button, EmptyState, IconButton, colors as tk, fontSize, radius, space } from '@trainerpro/ui';
export {
  DeleteConfirmModal,
  EditNoteModal,
  type DeleteConfirmModalProps,
  type EditNoteModalProps,
} from './NotesScreen.modals';

const ICON_CLOSE = '✕' as const;
const DATE_INPUT_TYPE = 'date' as const;
const COLOR_WHITE = tk.surface;
const VARIANT_SECONDARY = 'secondary' as const;
const TONE_DANGER = 'danger' as const;

const colors = {
  primary: tk.primary,
  text: tk.text,
  textMuted: tk.textMuted,
};

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

type HistoryNoteRowProps = {
  note: NoteData;
  onEdit: (note: NoteData) => void;
  onDelete: (note: NoteData) => void;
  t: TFunc;
};

function HistoryNoteRow({ note, onEdit, onDelete, t }: HistoryNoteRowProps): React.JSX.Element {
  const fmt = (d: Date) => formatNoteDate(d, t);
  const badgeLabel =
    note.type === 'general'
      ? t('coach.notes.history.myNotes')
      : t('coach.notes.type.client', { name: note.clientName?.toUpperCase() });
  return (
    <View style={{ marginBottom: space.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
        <View
          style={{
            paddingHorizontal: space.sm,
            paddingVertical: space.xs,
            borderRadius: radius.sm,
            backgroundColor: note.type === 'general' ? tk.primarySoft : tk.successSoft,
          }}
        >
          <Text
            style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: note.type === 'general' ? tk.primary : tk.success }}
          >
            {badgeLabel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginRight: space.md }}>
            {fmt(note.createdAt)}
          </Text>
          <IconButton
            accessibilityLabel={t('coach.notes.delete.action')}
            icon={(color) => <Text style={{ fontSize: fontSize.xs, color }}>{ICON_CLOSE}</Text>}
            onPress={() => onDelete(note)}
            size={24}
            tone={TONE_DANGER}
          />
        </View>
      </View>
      <Pressable onPress={() => onEdit(note)}>
        <View>
          <Text
            style={{ fontSize: fontSize.sm, fontWeight: 'bold', color: colors.text, marginBottom: space.xs }}
            numberOfLines={1}
          >
            {note.content.split('\n')[0]}
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }} numberOfLines={2}>
            {note.content.split('\n').slice(1).join('\n') || note.content}
          </Text>
        </View>
      </Pressable>
      <View style={{ height: 1, backgroundColor: tk.border, marginTop: space.lg }} />
    </View>
  );
}

type HistorySidebarFiltersProps = {
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  historyFilter: 'all' | 'general' | 'client';
  setHistoryFilter: (f: 'all' | 'general' | 'client') => void;
  selectedClient: ClientData | null;
  t: TFunc;
};

function HistorySidebarFilters(props: HistorySidebarFiltersProps): React.JSX.Element {
  const vm = {
    historyFilter: props.historyFilter,
    selectedClient: props.selectedClient,
    t: props.t,
  };
  return (
    <View style={{ padding: space.xl, borderBottomWidth: 1, borderColor: tk.border, flexShrink: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
        <View style={{ marginRight: space.sm }}>
          <Clock color={colors.textMuted} size={20} />
        </View>
        <Text style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text }}>
          {vm.t('coach.notes.history.recent')}
        </Text>
      </View>
      <HistoryDateFilters props={props} />
      <HistoryTypeFilters props={props} />
    </View>
  );
}

function HistoryDateFilters(props: { props: HistorySidebarFiltersProps }): React.JSX.Element {
  return (
    <>
      <DateFilterInput
        label={props.props.t('coach.notes.history.dateFrom')}
        onChange={props.props.setDateFrom}
        value={props.props.dateFrom}
      />
      <DateFilterInput
        label={props.props.t('coach.notes.history.dateTo')}
        onChange={props.props.setDateTo}
        value={props.props.dateTo}
      />
    </>
  );
}

function DateFilterInput(props: { label: string; onChange: (v: string) => void; value: string }): React.JSX.Element {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: colors.textMuted, marginBottom: space.sm }}>
        {props.label}
      </Text>
      <input
        type={DATE_INPUT_TYPE}
        value={props.value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => props.onChange(event.target.value)}
        style={dateInputStyle}
      />
    </View>
  );
}

function HistoryTypeFilters(props: { props: HistorySidebarFiltersProps }): React.JSX.Element {
  const t = props.props.t;
  const chips = readHistoryChips(props.props);
  return (
    <View>
      <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: colors.textMuted, marginBottom: space.sm }}>
        {t('coach.notes.history.filter.title')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
        {chips.map((chip) => (
          <HistoryFilterChip key={chip.value} active={chip.active} label={chip.label} onPress={chip.onPress} />
        ))}
      </View>
    </View>
  );
}

function readHistoryChips(props: HistorySidebarFiltersProps) {
  const entries: Array<{
    active: boolean;
    label: string;
    onPress: () => void;
    value: 'all' | 'client' | 'general';
  }> = [
    {
      active: props.historyFilter === 'all',
      label: props.t('coach.notes.history.filter.all'),
      onPress: () => props.setHistoryFilter('all'),
      value: 'all',
    },
    {
      active: props.historyFilter === 'general',
      label: props.t('coach.notes.history.filter.general'),
      onPress: () => props.setHistoryFilter('general'),
      value: 'general',
    },
  ];
  if (props.selectedClient) {
    entries.push({
      active: props.historyFilter === 'client',
      label: props.selectedClient.firstName,
      onPress: () => props.setHistoryFilter('client'),
      value: 'client',
    });
  }
  return entries;
}

function HistoryFilterChip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={historyChipStyle(props.active)}>
      <Text style={historyChipTextStyle(props.active)}>{props.label}</Text>
    </Pressable>
  );
}

const HISTORY_STACKED_HEIGHT = 560;

export type HistorySidebarProps = {
  stacked?: boolean;
  displayedNotes: NoteData[];
  historyFilter: 'all' | 'general' | 'client';
  setHistoryFilter: (f: 'all' | 'general' | 'client') => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  selectedClient: ClientData | null;
  showAllHistory: boolean;
  setShowAllHistory: (v: boolean) => void;
  onEditNote: (note: NoteData) => void;
  onDeleteNote: (note: NoteData) => void;
  t: TFunc;
};

// eslint-disable-next-line max-lines-per-function
export function HistorySidebar(props: HistorySidebarProps): React.JSX.Element {
  const { displayedNotes, showAllHistory, t } = props;

  const historyList =
    displayedNotes.length === 0 ? (
      <EmptyState title={t('coach.notes.history.empty')} />
    ) : (
      displayedNotes.map((note: NoteData) => (
        <HistoryNoteRow key={note.id} note={note} onDelete={props.onDeleteNote} onEdit={props.onEditNote} t={t} />
      ))
    );

  return (
    <View
      style={{
        width: props.stacked ? '100%' : 380,
        height: props.stacked ? HISTORY_STACKED_HEIGHT : undefined,
        flexShrink: 0,
        alignSelf: 'stretch',
        minHeight: 0,
        maxHeight: props.stacked ? undefined : ('100%' as unknown as number),
        backgroundColor: 'white',
        borderLeftWidth: props.stacked ? 0 : 1,
        borderTopWidth: props.stacked ? 1 : 0,
        borderColor: tk.border,
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <HistorySidebarFilters
        dateFrom={props.dateFrom}
        setDateFrom={props.setDateFrom}
        dateTo={props.dateTo}
        setDateTo={props.setDateTo}
        historyFilter={props.historyFilter}
        setHistoryFilter={props.setHistoryFilter}
        selectedClient={props.selectedClient}
        t={t}
      />
      {Platform.OS === 'web' ? (
        <div
          style={
            {
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              overflowY: 'auto',
              padding: space.xl,
              paddingBottom: space.sm,
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties
          }
        >
          {historyList}
        </div>
      ) : (
        <ScrollView
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 }}
          contentContainerStyle={{ padding: space.xl, paddingBottom: space.sm }}
        >
          {historyList}
        </ScrollView>
      )}
      <View
        style={{
          flexShrink: 0,
          padding: space.lg,
          paddingTop: space.md,
          borderTopWidth: 1,
          borderColor: tk.border,
          backgroundColor: tk.surface,
          shadowColor: tk.text,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Button
          fullWidth
          label={showAllHistory ? t('coach.notes.history.lastMonth') : t('coach.notes.history.viewAll')}
          onPress={() => {
            props.setDateFrom('');
            props.setDateTo('');
            props.setShowAllHistory(!showAllHistory);
          }}
          variant={VARIANT_SECONDARY}
        />
      </View>
    </View>
  );
}

const dateInputStyle: React.CSSProperties = {
  backgroundColor: tk.surfaceMuted,
  border: `1px solid ${tk.border}`,
  borderRadius: radius.md,
  padding: space.md,
  fontSize: fontSize.sm,
  width: '100%',
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

function historyChipStyle(active: boolean) {
  return {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: active ? colors.primary : tk.background,
    margin: space.xs,
  };
}

function historyChipTextStyle(active: boolean) {
  return {
    fontSize: fontSize.xs,
    fontWeight: 'bold' as const,
    color: active ? COLOR_WHITE : colors.textMuted,
  };
}
