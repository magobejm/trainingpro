import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Lock } from 'lucide-react';
import '../../i18n';
import { useClientObjectivesQuery, useClientsQuery } from '../../data/hooks/useClientsQuery';
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useUpdateNoteMutation,
} from '../../data/hooks/useNotesQuery';
import type { ClientData, NoteData } from './notes-screen.types';
import { filterAndSortNotes } from './notes-screen.utils';
import { matchesSearch } from '../../utils/normalize-search';
import { LIST_KEYS, readRouteClientId } from '../../layout/list-context';
import { useListContext, useRouteClient } from '../../layout/useListContext';
import { DeleteConfirmModal, EditNoteModal, HistorySidebar } from './NotesScreen.parts';
import { ClientNoteSection } from './NotesScreen.client-section';

const theme = {
  colors: {
    background: '#f8fafc',
    primary: '#3b82f6',
    text: '#0f172a',
    textMuted: '#64748b',
  },
};

type GeneralNoteSectionProps = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  t: (k: string) => string;
};

function GeneralNoteSection({ value, onChange, onSave, t }: GeneralNoteSectionProps): React.JSX.Element {
  return (
    <View style={{ marginBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ marginRight: 8 }}>
          <Lock color={theme.colors.textMuted} size={20} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>{t('coach.notes.private.title')}</Text>
      </View>
      <View style={generalCardStyle}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t('coach.notes.private.placeholder')}
          multiline
          style={{ padding: 24, minHeight: 200, fontSize: 16, color: theme.colors.text }}
        />
        <View style={generalFooterStyle}>
          <Pressable onPress={onSave} style={primaryButtonStyle}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('coach.notes.save')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function NotesScreen(): React.JSX.Element {
  const vm = useNotesScreenModel();
  const { t } = vm;
  return (
    <View style={screenRootStyle}>
      <ScrollView style={{ flex: 1, minHeight: 0, padding: 40 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ maxWidth: 1200, marginHorizontal: 'auto' }}>
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 }}>
              {t('coach.notes.title')}
            </Text>
            <Text style={{ fontSize: 16, color: theme.colors.textMuted }}>{t('coach.notes.subtitle')}</Text>
          </View>
          <GeneralNoteSection
            onChange={vm.setGeneralNoteText}
            onSave={vm.handleSaveGeneralNote}
            t={t}
            value={vm.generalNoteText}
          />
          <ClientNoteSection
            clientNoteText={vm.clientNoteText}
            clientSearch={vm.clientSearch}
            filteredClients={vm.filteredClients}
            objectives={vm.objectives}
            onSave={vm.handleSaveClientNote}
            selectedClient={vm.selectedClient}
            selectedObjective={vm.selectedObjective}
            setClientNoteText={vm.setClientNoteText}
            setClientSearch={vm.setClientSearch}
            setSelectedClient={vm.setSelectedClient}
            setSelectedObjective={vm.setSelectedObjective}
            t={t}
          />
        </View>
      </ScrollView>
      <HistorySidebar
        dateFrom={vm.dateFrom}
        dateTo={vm.dateTo}
        displayedNotes={vm.displayedNotes}
        historyFilter={vm.historyFilter}
        onDeleteNote={vm.setDeleteConfirmNote}
        onEditNote={vm.handleEditNote}
        selectedClient={vm.selectedClient}
        setDateFrom={vm.setDateFrom}
        setDateTo={vm.setDateTo}
        setHistoryFilter={vm.setHistoryFilter}
        setShowAllHistory={vm.setShowAllHistory}
        showAllHistory={vm.showAllHistory}
        t={t}
      />
      <EditNoteModal
        editContent={vm.editContent}
        editingNote={vm.editingNote}
        onClose={() => vm.setEditingNote(null)}
        onSave={vm.handleSaveEdit}
        setEditContent={vm.setEditContent}
        t={t}
      />
      <DeleteConfirmModal
        note={vm.deleteConfirmNote}
        onCancel={() => vm.setDeleteConfirmNote(null)}
        onConfirm={vm.handleDeleteNote}
        t={t}
      />
    </View>
  );
}

function useNotesScreenModel() {
  const { t } = useTranslation();
  const [generalNoteText, setGeneralNoteText] = useState('');
  const [clientNoteText, setClientNoteText] = useState('');
  const { filters, setFilters } = useNotesFilters();
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<NoteData | null>(null);

  const clients = useClientsQuery().data ?? [];
  const objectives = useClientObjectivesQuery().data ?? [];
  const notes = useNotesQuery().data ?? [];
  const createNoteMutation = useCreateNoteMutation();
  const updateNoteMutation = useUpdateNoteMutation();
  const deleteNoteMutation = useDeleteNoteMutation();

  const selectedClient = clients.find((client) => client.id === filters.selectedClientId) ?? null;
  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const name = `${client.firstName} ${client.lastName}`;
        const matchesName = matchesSearch(name, filters.clientSearch);
        return matchesName && (filters.selectedObjective ? client.objectiveId === filters.selectedObjective : true);
      }),
    [clients, filters.clientSearch, filters.selectedObjective],
  );
  const displayedNotes = useMemo(
    () =>
      filterAndSortNotes(
        notes,
        filters.historyFilter,
        selectedClient,
        filters.dateFrom,
        filters.dateTo,
        filters.showAllHistory,
      ),
    [filters.dateFrom, filters.dateTo, filters.historyFilter, filters.showAllHistory, notes, selectedClient],
  );

  const commands = readNoteCommands({
    clientNoteText,
    createNoteMutation,
    deleteConfirmNote,
    deleteNoteMutation,
    editContent,
    editingNote,
    generalNoteText,
    selectedClient,
    setClientNoteText,
    setDeleteConfirmNote,
    setEditContent,
    setEditingNote,
    setGeneralNoteText,
    updateNoteMutation,
  });

  return {
    clientNoteText,
    clientSearch: filters.clientSearch,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    deleteConfirmNote,
    displayedNotes,
    editContent,
    editingNote,
    filteredClients,
    generalNoteText,
    ...commands,
    historyFilter: filters.historyFilter,
    objectives,
    selectedClient,
    selectedObjective: filters.selectedObjective,
    setClientNoteText,
    setClientSearch: (clientSearch: string) => setFilters((prev) => ({ ...prev, clientSearch })),
    setDateFrom: (dateFrom: string) => setFilters((prev) => ({ ...prev, dateFrom })),
    setDateTo: (dateTo: string) => setFilters((prev) => ({ ...prev, dateTo })),
    setDeleteConfirmNote,
    setEditContent,
    setEditingNote,
    setGeneralNoteText,
    setHistoryFilter: (historyFilter: NotesFilters['historyFilter']) => setFilters((prev) => ({ ...prev, historyFilter })),
    setSelectedClient: (client: ClientData | null) =>
      selectNotesClient(client, filters.selectedClientId, setClientNoteText, setFilters),
    setSelectedObjective: (selectedObjective: string) => setFilters((prev) => ({ ...prev, selectedObjective })),
    setShowAllHistory: (showAllHistory: boolean) => setFilters((prev) => ({ ...prev, showAllHistory })),
    showAllHistory: filters.showAllHistory,
    t,
  };
}

function readNoteCommands(input: {
  clientNoteText: string;
  createNoteMutation: ReturnType<typeof useCreateNoteMutation>;
  deleteConfirmNote: NoteData | null;
  deleteNoteMutation: ReturnType<typeof useDeleteNoteMutation>;
  editContent: string;
  editingNote: NoteData | null;
  generalNoteText: string;
  selectedClient: { id: string } | null;
  setClientNoteText: (value: string) => void;
  setDeleteConfirmNote: (note: NoteData | null) => void;
  setEditContent: (value: string) => void;
  setEditingNote: (note: NoteData | null) => void;
  setGeneralNoteText: (value: string) => void;
  updateNoteMutation: ReturnType<typeof useUpdateNoteMutation>;
}) {
  return {
    handleDeleteNote: async () => {
      if (!input.deleteConfirmNote) return;
      await input.deleteNoteMutation.mutateAsync(input.deleteConfirmNote.id);
      input.setDeleteConfirmNote(null);
    },
    handleEditNote: (note: NoteData) => {
      input.setEditingNote(note);
      input.setEditContent(note.content);
    },
    handleSaveClientNote: async () => {
      if (!input.clientNoteText.trim() || !input.selectedClient) return;
      await input.createNoteMutation.mutateAsync({
        clientId: input.selectedClient.id,
        content: input.clientNoteText.trim(),
        type: 'client',
      });
      input.setClientNoteText('');
    },
    handleSaveEdit: async () => {
      if (!input.editingNote || !input.editContent.trim()) return;
      await input.updateNoteMutation.mutateAsync({
        input: { content: input.editContent.trim() },
        noteId: input.editingNote.id,
      });
      input.setEditingNote(null);
    },
    handleSaveGeneralNote: async () => {
      if (!input.generalNoteText.trim()) return;
      await input.createNoteMutation.mutateAsync({ content: input.generalNoteText.trim(), type: 'general' });
      input.setGeneralNoteText('');
    },
  };
}

type NotesFilters = {
  clientSearch: string;
  dateFrom: string;
  dateTo: string;
  historyFilter: 'all' | 'client' | 'general';
  selectedClientId: string;
  selectedObjective: string;
  showAllHistory: boolean;
};

function useNotesFilters() {
  const [filters, setFilters] = useListContext(LIST_KEYS.notes, emptyNotesFilters(), reviveNotesFilters);
  useRouteClient(filters.selectedClientId);
  return { filters, setFilters };
}

function emptyNotesFilters(): NotesFilters {
  return {
    clientSearch: '',
    dateFrom: '',
    dateTo: '',
    historyFilter: 'all',
    selectedClientId: '',
    selectedObjective: '',
    showAllHistory: false,
  };
}

function reviveNotesFilters(stored: NotesFilters | null, initial: NotesFilters): NotesFilters {
  const base = stored ?? initial;
  if (base.selectedClientId) return base;
  const urlClient = readRouteClientId();
  return urlClient ? { ...base, selectedClientId: urlClient } : base;
}

function selectNotesClient(
  client: ClientData | null,
  currentId: string,
  setClientNoteText: (value: string) => void,
  setFilters: React.Dispatch<React.SetStateAction<NotesFilters>>,
): void {
  const nextId = client?.id ?? '';
  if (nextId !== currentId) setClientNoteText('');
  setFilters((prev) => ({ ...prev, selectedClientId: nextId }));
}

const screenRootStyle = {
  flex: 1,
  flexDirection: 'row' as const,
  backgroundColor: theme.colors.background,
  minHeight: 0,
  alignSelf: 'stretch' as const,
  overflow: 'hidden' as const,
};

const generalCardStyle = {
  backgroundColor: 'white',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
  overflow: 'hidden' as const,
};

const generalFooterStyle = {
  padding: 16,
  borderTopWidth: 1,
  borderColor: '#e2e8f0',
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
};

const primaryButtonStyle = {
  backgroundColor: theme.colors.primary,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 12,
};
