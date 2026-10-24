import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientDayNotes, type ClientDayNoteItem } from '../../data/hooks/useClientCalendar';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { LIGHT } from '../../theme/light';
import { ClientNoteDayEditor } from './ClientNoteDayEditor';
import { buildNoteRows, todayKey, type NoteRow } from './client-notes.helpers';

type Props = { onClose: () => void };

const SPINNER_COLOR = LIGHT.accent;
const SEARCH_WAIT_MS = 350;

export function ClientNotesScreen(props: Props): React.JSX.Element {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(draft.trim()), SEARCH_WAIT_MS);
    return () => clearTimeout(timer);
  }, [draft]);
  const notes = useClientDayNotes(query);
  const items = notes.data?.pages.flatMap((page) => page.items) ?? [];
  if (editing) {
    return (
      <ClientNoteDayEditor
        date={editing}
        knownContent={contentFor(items, editing)}
        onClose={() => setEditing(null)}
        onShift={setEditing}
      />
    );
  }
  return (
    <NotesList
      draft={draft}
      hasNextPage={notes.hasNextPage}
      isError={notes.isError}
      isLoading={notes.isLoading}
      items={items}
      onClose={props.onClose}
      onEndReached={() => {
        if (notes.hasNextPage && !notes.isFetchingNextPage) void notes.fetchNextPage();
      }}
      onOpen={setEditing}
      onSearch={setDraft}
      query={query}
    />
  );
}

function contentFor(items: ClientDayNoteItem[], date: string): string | null {
  return items.find((item) => item.date === date)?.content ?? null;
}

function NotesList(props: {
  draft: string;
  hasNextPage: boolean;
  isError: boolean;
  isLoading: boolean;
  items: ClientDayNoteItem[];
  onClose: () => void;
  onEndReached: () => void;
  onOpen: (date: string) => void;
  onSearch: (value: string) => void;
  query: string;
}): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const rows = buildNoteRows(props.items, i18n.language);
  return (
    <View style={styles.screen}>
      <OverlayBackHeader onClose={props.onClose} title={t('client.diary.title')} />
      <TextInput
        onChangeText={props.onSearch}
        placeholder={t('client.diary.searchPlaceholder')}
        placeholderTextColor={LIGHT.textMuted}
        style={styles.search}
        value={props.draft}
      />
      <Pressable onPress={() => props.onOpen(todayKey())} style={styles.today}>
        <Text style={styles.todayText}>{t('client.diary.today')}</Text>
      </Pressable>
      <NotesBody
        isError={props.isError}
        isLoading={props.isLoading}
        onEndReached={props.onEndReached}
        onOpen={props.onOpen}
        query={props.query}
        rows={rows}
        showFooter={props.hasNextPage}
      />
    </View>
  );
}

function NotesBody(props: {
  isError: boolean;
  isLoading: boolean;
  onEndReached: () => void;
  onOpen: (date: string) => void;
  query: string;
  rows: NoteRow[];
  showFooter: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  if (props.isLoading) return <ActivityIndicator color={SPINNER_COLOR} style={styles.spinner} />;
  if (props.isError) return <Text style={styles.empty}>{t('client.diary.loadError')}</Text>;
  if (props.rows.length === 0) {
    const key = props.query.length >= 2 ? 'client.diary.noResults' : 'client.diary.empty';
    return <Text style={styles.empty}>{t(key)}</Text>;
  }
  return (
    <FlatList
      data={props.rows}
      keyExtractor={(row) => row.key}
      ListFooterComponent={props.showFooter ? <ActivityIndicator color={SPINNER_COLOR} style={styles.footer} /> : null}
      onEndReached={props.onEndReached}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => <NoteRowView onOpen={props.onOpen} row={item} />}
    />
  );
}

function NoteRowView(props: { onOpen: (date: string) => void; row: NoteRow }): React.JSX.Element {
  if (props.row.kind === 'month') return <Text style={styles.month}>{props.row.title}</Text>;
  const row = props.row;
  return (
    <Pressable onPress={() => props.onOpen(row.date)} style={styles.card}>
      <Text style={styles.date}>{row.label}</Text>
      <Text numberOfLines={2} style={styles.content}>
        {row.content}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 14,
  },
  content: { color: LIGHT.text, fontSize: 14, marginTop: 4 },
  date: { color: LIGHT.textStrong, fontWeight: '700' },
  empty: { color: LIGHT.textMuted, marginHorizontal: 16, marginTop: 24, textAlign: 'center' },
  footer: { marginVertical: 16 },
  month: {
    color: LIGHT.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  screen: { backgroundColor: LIGHT.bg, flex: 1 },
  search: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 12,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  spinner: { marginTop: 32 },
  today: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.accent,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  todayText: { color: LIGHT.textOnNavy, fontWeight: '700' },
});
