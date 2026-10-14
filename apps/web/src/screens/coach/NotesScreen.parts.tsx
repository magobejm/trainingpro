import { QueryResult } from '../../components/AsyncStatus';
import { useTranslation } from 'react-i18next';
import { WebBox } from '@trainerpro/ui';
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
  getLayoutStyle17,
  getLayoutStyle18,
  getLayoutStyle19,
  getLayoutStyle20,
  getLayoutStyle21,
  getLayoutStyle22,
} from './NotesScreen.parts.layout-styles';

import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock } from 'lucide-react';
import type { ClientData, NoteData } from './notes-screen.types';
import { formatNoteDate } from './notes-screen.utils';
import { Button, DateTimeField, IconButton, colors as tk, fontSize, radius, space } from '@trainerpro/ui';
export {
  DeleteConfirmModal,
  EditNoteModal,
  type DeleteConfirmModalProps,
  type EditNoteModalProps,
} from './NotesScreen.modals';
const ICON_CLOSE = '✕' as const;
const COLOR_WHITE = tk.surface;
const VARIANT_SECONDARY = 'secondary' as const;
const TONE_DANGER = 'danger' as const;
type TFunc = (k: string, opts?: Record<string, unknown>) => string;
type HistoryNoteRowProps = {
  note: NoteData;
  onEdit: (note: NoteData) => void;
  onDelete: (note: NoteData) => void;
  t: TFunc;
};
function HistoryNoteRow({ note, onEdit, onDelete, t }: HistoryNoteRowProps): React.JSX.Element {
  const { i18n } = useTranslation();
  const fmt = (d: Date) => formatNoteDate(d, t, i18n.language);
  const badgeLabel =
    note.type === 'general'
      ? t('coach.notes.history.myNotes')
      : t('coach.notes.type.client', { name: note.clientName?.toUpperCase() });
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  const layoutStyle3 = getLayoutStyle3(note.type === 'general' ? tk.primarySoft : tk.successSoft);
  const layoutStyle4 = getLayoutStyle4(note.type === 'general' ? tk.primary : tk.success);
  const layoutStyle5 = getLayoutStyle5;
  const layoutStyle6 = getLayoutStyle6;
  const layoutStyle8 = getLayoutStyle7;
  const layoutStyle9 = getLayoutStyle8;
  const layoutStyle10 = getLayoutStyle9;
  return (
    <View {...{ dataSet: { 'density-row': 'true' } }} style={layoutStyle1}>
      <View style={layoutStyle2}>
        <View style={layoutStyle3}>
          <Text style={layoutStyle4}>{badgeLabel}</Text>
        </View>
        <View style={layoutStyle5}>
          <Text style={layoutStyle6}>{fmt(note.createdAt)}</Text>
          <IconButton
            accessibilityLabel={t('coach.notes.delete.action')}
            icon={(color) => {
              const layoutStyle7 = getLayoutStyle10(color);
              return <Text style={layoutStyle7}>{ICON_CLOSE}</Text>;
            }}
            onPress={() => onDelete(note)}
            size={24}
            tone={TONE_DANGER}
          />
        </View>
      </View>
      <Pressable onPress={() => onEdit(note)}>
        <View>
          <Text style={layoutStyle8} numberOfLines={1}>
            {note.content.split('\n')[0]}
          </Text>
          <Text style={layoutStyle9} numberOfLines={2}>
            {note.content.split('\n').slice(1).join('\n') || note.content}
          </Text>
        </View>
      </Pressable>
      <View style={layoutStyle10} />
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
  const layoutStyle11 = getLayoutStyle11;
  const layoutStyle12 = getLayoutStyle12;
  const layoutStyle13 = getLayoutStyle13;
  const layoutStyle14 = getLayoutStyle14;
  return (
    <View style={layoutStyle11}>
      <View style={layoutStyle12}>
        <View style={layoutStyle13}>
          <Clock color={tk.textMuted} size={20} />
        </View>
        <Text style={layoutStyle14}>{vm.t('coach.notes.history.recent')}</Text>
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
function DateFilterInput(props: { label: string; onChange: (value: string) => void; value: string }): React.JSX.Element {
  return <DateTimeField type={'date'} label={props.label} value={props.value} onChange={props.onChange} />;
}
function HistoryTypeFilters(props: { props: HistorySidebarFiltersProps }): React.JSX.Element {
  const t = props.props.t;
  const chips = readHistoryChips(props.props);
  const layoutStyle17 = getLayoutStyle17;
  const layoutStyle18 = getLayoutStyle18;
  return (
    <View>
      <Text style={layoutStyle17}>{t('coach.notes.history.filter.title')}</Text>
      <View style={layoutStyle18}>
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
  notesQuery: {
    error: unknown;
    isError: boolean;
    isLoading: boolean;
    refetch: () => unknown;
  };
  onCreateNote: () => void;
  onClearClient: () => void;
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
  const filtered = Boolean(props.dateFrom || props.dateTo || props.historyFilter !== 'all' || props.selectedClient);
  const historyList =
    QueryResult({
      emptyIllustration: 'notes',
      emptyTitle: t('coach.notes.history.empty'),
      emptyMessage: t('coach.notes.history.emptyInvite'),
      emptyActionLabel: t('coach.notes.private.title'),
      onEmptyAction: props.onCreateNote,
      skeleton: 'rows',
      isLoading: props.notesQuery.isLoading,
      isError: props.notesQuery.isError,
      error: props.notesQuery.error,
      itemCount: displayedNotes.length,
      hasActiveFilter: filtered,
      onRetry: () => void props.notesQuery.refetch(),
      onClearFilters: () => {
        props.setDateFrom('');
        props.setDateTo('');
        props.setHistoryFilter('all');
        props.setShowAllHistory(true);
        props.onClearClient();
      },
    }) ??
    displayedNotes.map((note: NoteData) => (
      <HistoryNoteRow key={note.id} note={note} onDelete={props.onDeleteNote} onEdit={props.onEditNote} t={t} />
    ));
  const layoutStyle19 = getLayoutStyle19(
    props.stacked ? '100%' : 380,
    props.stacked ? HISTORY_STACKED_HEIGHT : undefined,
    props.stacked ? undefined : ('100%' as unknown as number),
    props.stacked ? 0 : 1,
    props.stacked ? 1 : 0,
  );
  const layoutStyle20 = getLayoutStyle20;
  const layoutStyle21 = getLayoutStyle21;
  const layoutStyle22 = getLayoutStyle22;
  return (
    <View style={layoutStyle19}>
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
        <WebBox data-density-list={'true'} style={historyScrollStyle}>
          {historyList}
        </WebBox>
      ) : (
        <ScrollView style={layoutStyle20} contentContainerStyle={layoutStyle21}>
          {historyList}
        </ScrollView>
      )}
      <View style={layoutStyle22}>
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
function historyChipStyle(active: boolean) {
  return {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: active ? tk.primary : tk.background,
    margin: space.xs,
  };
}
function historyChipTextStyle(active: boolean) {
  return {
    fontSize: fontSize.xs,
    fontWeight: 'bold' as const,
    color: active ? COLOR_WHITE : tk.textMuted,
  };
}

const historyScrollStyle: React.CSSProperties = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0,
  minHeight: 0,
  overflowY: 'auto',
  padding: space.xl,
  paddingBottom: space.sm,
  WebkitOverflowScrolling: 'touch',
};
