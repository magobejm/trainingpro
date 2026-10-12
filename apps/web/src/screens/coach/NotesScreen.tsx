import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
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
import { Button, TextField, colors, fontSize, space, useToast } from '@trainerpro/ui';

const theme = {
  colors: {
    background: colors.surfaceMuted,
    primary: colors.primary,
    text: colors.text,
    textMuted: colors.textMuted,
  },
};

type GeneralNoteSectionProps = {
  value: string;
  onChange: (v: string) => void;
  isSaving?: boolean;
  onSave: () => void;
  t: (k: string) => string;
};

function GeneralNoteSection({ value, onChange, isSaving, onSave, t }: GeneralNoteSectionProps): React.JSX.Element {
  return (
    <View style={{ marginBottom: space.xxxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
        <View style={{ marginRight: space.sm }}>
          <Lock color={theme.colors.textMuted} size={20} />
        </View>
        <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: theme.colors.text }}>
          {t('coach.notes.private.title')}
        </Text>
      </View>
      <View style={generalCardStyle}>
        <View style={{ padding: space.lg }}>
          <TextField
            accessibilityLabel={t('coach.notes.private.title')}
            multiline
            numberOfLines={8}
            onChangeText={onChange}
            placeholder={t('coach.notes.private.placeholder')}
            value={value}
          />
        </View>
        <View style={generalFooterStyle}>
          <Button label={t('coach.notes.save')} loading={isSaving} onPress={onSave} />
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
      <ScrollView style={{ flex: 1, minHeight: 0, padding: space.xxxl }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ maxWidth: 1200, marginHorizontal: 'auto' }}>
          <View style={{ marginBottom: space.xxxl }}>
            <Text style={{ fontSize: fontSize.xxxl, fontWeight: 'bold', color: theme.colors.text, marginBottom: space.sm }}>
              {t('coach.notes.title')}
            </Text>
            <Text style={{ fontSize: fontSize.md, color: theme.colors.textMuted }}>{t('coach.notes.subtitle')}</Text>
          </View>
          <GeneralNoteSection
            isSaving={vm.isCreating}
            onChange={vm.setGeneralNoteText}
            onSave={vm.handleSaveGeneralNote}
            t={t}
            value={vm.generalNoteText}
          />
          <ClientNoteSection
            clientNoteText={vm.clientNoteText}
            clientSearch={vm.clientSearch}
            filteredClients={vm.filteredClients}
            isSaving={vm.isCreating}
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
        isSaving={vm.isUpdating}
        onClose={() => vm.setEditingNote(null)}
        onSave={vm.handleSaveEdit}
        setEditContent={vm.setEditContent}
        t={t}
      />
      <DeleteConfirmModal
        isDeleting={vm.isDeleting}
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
  const toast = useToast();
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
    t,
    toast,
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
    isCreating: createNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
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
  t: (k: string) => string;
  toast: ReturnType<typeof useToast>;
  updateNoteMutation: ReturnType<typeof useUpdateNoteMutation>;
}) {
  const run = async (action: () => Promise<unknown>, successKey: string, errorKey: string): Promise<boolean> => {
    try {
      await action();
      input.toast.success(input.t(successKey));
      return true;
    } catch {
      input.toast.error(input.t(errorKey));
      return false;
    }
  };
  return {
    handleDeleteNote: async () => {
      if (!input.deleteConfirmNote) return;
      const id = input.deleteConfirmNote.id;
      const ok = await run(
        () => input.deleteNoteMutation.mutateAsync(id),
        'coach.notes.toast.deleted',
        'coach.notes.error.delete',
      );
      if (ok) input.setDeleteConfirmNote(null);
    },
    handleEditNote: (note: NoteData) => {
      input.setEditingNote(note);
      input.setEditContent(note.content);
    },
    handleSaveClientNote: async () => {
      if (!input.clientNoteText.trim() || !input.selectedClient) return;
      const clientId = input.selectedClient.id;
      const content = input.clientNoteText.trim();
      const ok = await run(
        () => input.createNoteMutation.mutateAsync({ clientId, content, type: 'client' }),
        'coach.notes.toast.created',
        'coach.notes.error.create',
      );
      if (ok) input.setClientNoteText('');
    },
    handleSaveEdit: async () => {
      if (!input.editingNote || !input.editContent.trim()) return;
      const noteId = input.editingNote.id;
      const content = input.editContent.trim();
      const ok = await run(
        () => input.updateNoteMutation.mutateAsync({ input: { content }, noteId }),
        'coach.notes.toast.updated',
        'coach.notes.error.update',
      );
      if (ok) input.setEditingNote(null);
    },
    handleSaveGeneralNote: async () => {
      if (!input.generalNoteText.trim()) return;
      const content = input.generalNoteText.trim();
      const ok = await run(
        () => input.createNoteMutation.mutateAsync({ content, type: 'general' }),
        'coach.notes.toast.created',
        'coach.notes.error.create',
      );
      if (ok) input.setGeneralNoteText('');
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
  borderColor: colors.border,
  overflow: 'hidden' as const,
};

const generalFooterStyle = {
  padding: space.lg,
  borderTopWidth: 1,
  borderColor: colors.border,
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
};
