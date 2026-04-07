import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock } from 'lucide-react';
import type { ClientData, NoteData } from './notes-screen.types';
import { formatNoteDate } from './notes-screen.utils';
export {
  DeleteConfirmModal,
  EditNoteModal,
  type DeleteConfirmModalProps,
  type EditNoteModalProps,
} from './NotesScreen.modals';

const ICON_CLOSE = '✕' as const;
const DATE_INPUT_TYPE = 'date' as const;
const COLOR_WHITE = '#ffffff' as const;

const colors = {
  primary: '#3b82f6',
  text: '#0f172a',
  textMuted: '#64748b',
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
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: note.type === 'general' ? '#eff6ff' : '#dcfce7',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: note.type === 'general' ? '#2563eb' : '#16a34a' }}>
            {badgeLabel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginRight: 12 }}>{fmt(note.createdAt)}</Text>
          <Pressable onPress={() => onDelete(note)}>
            <Text style={{ fontSize: 12, color: '#ef4444' }}>{ICON_CLOSE}</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={() => onEdit(note)}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 4 }} numberOfLines={1}>
            {note.content.split('\n')[0]}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={2}>
            {note.content.split('\n').slice(1).join('\n') || note.content}
          </Text>
        </View>
      </Pressable>
      <View style={{ height: 1, backgroundColor: '#e2e8f0', marginTop: 16 }} />
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
    <View style={{ padding: 24, borderBottomWidth: 1, borderColor: '#e2e8f0', flexShrink: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ marginRight: 8 }}>
          <Clock color={colors.textMuted} size={20} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{vm.t('coach.notes.history.recent')}</Text>
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
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted, marginBottom: 8 }}>{props.label}</Text>
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
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted, marginBottom: 8 }}>
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

export type HistorySidebarProps = {
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

export function HistorySidebar(props: HistorySidebarProps): React.JSX.Element {
  const { displayedNotes, showAllHistory, t } = props;

  const historyList =
    displayedNotes.length === 0 ? (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>{t('coach.notes.history.empty')}</Text>
      </View>
    ) : (
      displayedNotes.map((note: NoteData) => (
        <HistoryNoteRow key={note.id} note={note} onDelete={props.onDeleteNote} onEdit={props.onEditNote} t={t} />
      ))
    );

  return (
    <View
      style={{
        width: 380,
        alignSelf: 'stretch',
        minHeight: 0,
        maxHeight: '100%' as unknown as number,
        backgroundColor: 'white',
        borderLeftWidth: 1,
        borderColor: '#e2e8f0',
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
              padding: 24,
              paddingBottom: 8,
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties
          }
        >
          {historyList}
        </div>
      ) : (
        <ScrollView
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 8 }}
        >
          {historyList}
        </ScrollView>
      )}
      <View
        style={{
          flexShrink: 0,
          padding: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={() => {
            props.setDateFrom('');
            props.setDateTo('');
            props.setShowAllHistory(!showAllHistory);
          }}
          style={{
            backgroundColor: '#f8fafc',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary, textAlign: 'center' }}>
            {showAllHistory ? t('coach.notes.history.lastMonth') : t('coach.notes.history.viewAll')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const dateInputStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 10,
  fontSize: 13,
  width: '100%',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

function historyChipStyle(active: boolean) {
  return {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: active ? colors.primary : '#f1f5f9',
    margin: 4,
  };
}

function historyChipTextStyle(active: boolean) {
  return {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: active ? COLOR_WHITE : colors.textMuted,
  };
}
