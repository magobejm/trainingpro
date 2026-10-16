import { useCoachEditor } from './useCoachEditor';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import {
  CoachButton,
  CoachConflict,
  CoachField,
  CoachPage,
  CoachSelect,
  CoachStatus,
  confirmCoachDelete,
  ui,
} from './CoachUi';
import { CoachClientPicker } from './CoachClientPicker';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { createApiClient } from '../../data/api-client';
import { useCoachSaveGuard } from './useCoachSaveGuard';
import { findCoachNote } from './coach-revision';
type Note = {
  id: string;
  content: string;
  clientId: string | null;
  type: 'general' | 'client';
  updatedAt: string;
  createdAt: string;
};
export function CoachNotesScreen({ clientId }: { clientId?: string }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState(clientId ?? '');
  const [type, setType] = useState(clientId ? 'client' : 'general');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cursor, setCursor] = useState('');
  const { value: editing, select: setEditing, close: closeEditor } = useCoachEditor<Note | 'new'>();
  const params = new URLSearchParams({
    type,
    limit: '50',
    ...(filter && type === 'client' ? { clientId: filter } : {}),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? { dateFrom: dateFrom + 'T00:00:00.000Z' } : {}),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? { dateTo: dateTo + 'T23:59:59.999Z' } : {}),
    ...(cursor ? { cursor } : {}),
  });
  const query = useCoachQuery<{ data: Note[]; nextCursor?: string }>('/notes?' + params);
  const write = useCoachWrite();
  if (editing)
    return (
      <NoteEditor
        key={editing === 'new' ? 'new:' + filter : editing.id}
        note={editing === 'new' ? undefined : editing}
        clientId={filter}
        type={type}
        onClose={closeEditor}
      />
    );
  return (
    <FlatList
      style={ui.page}
      contentContainerStyle={ui.content}
      data={query.data?.data ?? []}
      keyExtractor={(note) => note.id}
      ListHeaderComponent={
        <View style={ui.field}>
          <Text style={ui.title}>{t('coachWorkspace.notes')}</Text>
          <CoachSelect
            label={t('coachWorkspace.scope')}
            value={type}
            onChange={(next) => {
              setType(next);
              setCursor('');
            }}
            options={['general', 'client'].map((value) => ({ value, label: t('coachWorkspace.' + value) }))}
          />
          {type === 'client' ? (
            <CoachClientPicker
              value={filter}
              onChange={(id) => {
                setFilter(id);
                setCursor('');
              }}
              optional
            />
          ) : null}
          {[
            { key: 'from', value: dateFrom, set: setDateFrom },
            { key: 'to', value: dateTo, set: setDateTo },
          ].map((field) => (
            <CoachField
              key={field.key}
              label={t('coachWorkspace.' + field.key)}
              value={field.value}
              onChange={(next) => {
                field.set(next);
                setCursor('');
              }}
            />
          ))}
          <CoachButton label={t('coachWorkspace.newNote')} onPress={() => setEditing('new')} />
          <CoachStatus query={query} empty={query.data?.data.length === 0} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={ui.card}>
          <Text style={ui.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={ui.text}>{item.content}</Text>
          <CoachButton label={t('coachWorkspace.edit')} onPress={() => setEditing(item)} />
          <CoachButton
            label={t('coachWorkspace.delete')}
            disabled={write.isPending}
            onPress={() =>
              confirmCoachDelete(item.content, () => write.mutate({ path: '/notes/' + item.id, method: 'DELETE' }), t)
            }
            danger
          />
        </View>
      )}
      ListFooterComponent={
        <View style={ui.row}>
          {cursor ? <CoachButton label={t('coachWorkspace.firstPage')} onPress={() => setCursor('')} /> : null}
          {query.data?.nextCursor ? (
            <CoachButton label={t('coachWorkspace.loadMore')} onPress={() => setCursor(query.data!.nextCursor!)} />
          ) : null}
        </View>
      }
    />
  );
}
function NoteEditor({
  note,
  clientId,
  type,
  onClose,
}: {
  note?: Note;
  clientId: string;
  type: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const write = useCoachWrite();
  const auth = useCoachAuth();
  const guard = useCoachSaveGuard();
  const draft = useCoachDraft(
    'note:' + (note?.id ?? clientId + ':' + type),
    { content: note?.content ?? '', clientId: note?.clientId ?? clientId },
    note?.updatedAt,
  );
  const persist = async () => {
    await write.mutateAsync({
      path: '/notes' + (note ? '/' + note.id : ''),
      method: note ? 'PATCH' : 'POST',
      body: note
        ? { content: draft.value.content }
        : { ...draft.value, type, clientId: type === 'client' ? draft.value.clientId : undefined },
    });
    await draft.clear();
    onClose();
  };
  const save = () =>
    note
      ? guard.run(
          note,
          () =>
            findCoachNote(note.id, (cursor) =>
              createApiClient(auth).get<{ data: Note[]; nextCursor?: string }>(
                '/notes?' +
                  new URLSearchParams({
                    type: note.type,
                    limit: '50',
                    ...(note.clientId ? { clientId: note.clientId } : {}),
                    ...(cursor ? { cursor } : {}),
                  }),
              ),
            ),
          persist,
        )
      : persist();
  return (
    <CoachPage title={t('coachWorkspace.newNote')} onBack={onClose}>
      <CoachConflict conflict={draft.conflict || guard.conflict} onDiscard={() => void draft.clear().then(onClose)} />
      {!note && type === 'client' ? (
        <CoachClientPicker
          value={draft.value.clientId}
          onChange={(id) => draft.setValue((old) => ({ ...old, clientId: id }))}
        />
      ) : null}
      <CoachField
        label={t('coachWorkspace.content')}
        value={draft.value.content}
        onChange={(content) => draft.setValue((old) => ({ ...old, content }))}
        multiline
      />
      <CoachButton
        label={t('coachWorkspace.save')}
        onPress={() => void save().catch(() => undefined)}
        disabled={
          !draft.ready ||
          draft.conflict ||
          guard.conflict ||
          !draft.value.content.trim() ||
          (type === 'client' && !draft.value.clientId)
        }
        loading={write.isPending || guard.busy}
      />
    </CoachPage>
  );
}
