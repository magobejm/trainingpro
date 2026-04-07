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
  const [clientSearch, setClientSearch] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<NoteData | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'general' | 'client'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const clients = useClientsQuery().data ?? [];
  const objectives = useClientObjectivesQuery().data ?? [];
  const notes = useNotesQuery().data ?? [];
  const createNoteMutation = useCreateNoteMutation();
  const updateNoteMutation = useUpdateNoteMutation();
  const deleteNoteMutation = useDeleteNoteMutation();

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const name = `${client.firstName} ${client.lastName}`.toLowerCase();
        const matchesName = name.includes(clientSearch.toLowerCase());
        return matchesName && (selectedObjective ? client.objectiveId === selectedObjective : true);
      }),
    [clientSearch, clients, selectedObjective],
  );
  const displayedNotes = useMemo(
    () => filterAndSortNotes(notes, historyFilter, selectedClient, dateFrom, dateTo, showAllHistory),
    [dateFrom, dateTo, historyFilter, notes, selectedClient, showAllHistory],
  );

  const handleSaveGeneralNote = async () => {
    if (!generalNoteText.trim()) return;
    await createNoteMutation.mutateAsync({ type: 'general', content: generalNoteText.trim() });
    setGeneralNoteText('');
  };
  const handleSaveClientNote = async () => {
    if (!clientNoteText.trim() || !selectedClient) return;
    await createNoteMutation.mutateAsync({
      type: 'client',
      clientId: selectedClient.id,
      content: clientNoteText.trim(),
    });
    setClientNoteText('');
  };
  const handleEditNote = (note: NoteData) => {
    setEditingNote(note);
    setEditContent(note.content);
  };
  const handleSaveEdit = async () => {
    if (!editingNote || !editContent.trim()) return;
    await updateNoteMutation.mutateAsync({
      noteId: editingNote.id,
      input: { content: editContent.trim() },
    });
    setEditingNote(null);
  };
  const handleDeleteNote = async () => {
    if (!deleteConfirmNote) return;
    await deleteNoteMutation.mutateAsync(deleteConfirmNote.id);
    setDeleteConfirmNote(null);
  };

  return {
    clientNoteText,
    clientSearch,
    dateFrom,
    dateTo,
    deleteConfirmNote,
    displayedNotes,
    editContent,
    editingNote,
    filteredClients,
    generalNoteText,
    handleDeleteNote,
    handleEditNote,
    handleSaveClientNote,
    handleSaveEdit,
    handleSaveGeneralNote,
    historyFilter,
    objectives,
    selectedClient,
    selectedObjective,
    setClientNoteText,
    setClientSearch,
    setDateFrom,
    setDateTo,
    setDeleteConfirmNote,
    setEditContent,
    setEditingNote,
    setGeneralNoteText,
    setHistoryFilter,
    setSelectedClient,
    setSelectedObjective,
    setShowAllHistory,
    showAllHistory,
    t,
  };
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
