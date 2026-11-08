import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WEEKLY_LOAD_MAX_CHARS } from '@trainerpro/shared';
import '../../i18n';
import type { ClientWellnessSession, ClientWellnessWeeklyLoad } from '../../data/hooks/useClientWellness';
import { LIGHT } from '../../theme/light';

export type JournalTab = 'comments' | 'load';

type Props = {
  initialTab?: JournalTab;
  isSaving: boolean;
  nextWeek: string;
  onSaveLoad: (content: string) => void;
  sessions: ClientWellnessSession[];
  weeklyLoads: ClientWellnessWeeklyLoad[];
};

export function MoodJournalTabs(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [tab, setTab] = useState<JournalTab>(props.initialTab ?? 'comments');
  useEffect(() => {
    if (props.initialTab) setTab(props.initialTab);
  }, [props.initialTab]);
  const comments = props.sessions.filter((s) => (s.finishComment ?? '').trim() !== '');
  const current = props.weeklyLoads.find((load) => load.weekStartDate === props.nextWeek) ?? null;
  const [draft, setDraft] = useState(current?.content ?? '');
  useEffect(() => setDraft(current?.content ?? ''), [current?.content]);
  const past = props.weeklyLoads.filter((load) => load.weekStartDate !== props.nextWeek);

  return (
    <View style={styles.card}>
      <View style={styles.tabs}>
        {(['comments', 'load'] as const).map((key) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key ? styles.tabOn : null]}>
            <Text style={[styles.tabText, tab === key ? styles.tabTextOn : null]}>{t(`client.mood.journal.${key}`)}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'comments' ? (
        <View style={styles.list}>
          {comments.length === 0 ? <Text style={styles.empty}>{t('client.mood.journal.commentsEmpty')}</Text> : null}
          {comments.map((session) => (
            <View key={session.id} style={styles.item}>
              <Text style={styles.itemMeta}>
                {`${session.sessionDate}${session.planDayTitle ? ` · ${session.planDayTitle}` : ''}${
                  session.sessionRpe === null ? '' : ` · RPE ${session.sessionRpe}/10`
                }`}
              </Text>
              <Text style={styles.itemText}>{session.finishComment}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          <Text style={styles.loadTitle}>{t('client.mood.journal.loadTitle')}</Text>
          <Text style={styles.empty}>{t('client.mood.journal.loadHelp', { date: props.nextWeek })}</Text>
          <TextInput
            maxLength={WEEKLY_LOAD_MAX_CHARS}
            multiline
            onChangeText={setDraft}
            placeholder={t('client.mood.journal.loadPlaceholder')}
            placeholderTextColor={LIGHT.textMuted}
            style={styles.input}
            textAlignVertical={'top'}
            value={draft}
          />
          <Pressable
            disabled={props.isSaving || (draft ?? '').trim() === (current?.content ?? '')}
            onPress={() => props.onSaveLoad(draft ?? '')}
            style={[
              styles.save,
              props.isSaving || (draft ?? '').trim() === (current?.content ?? '') ? styles.saveOff : null,
            ]}
          >
            <Text style={styles.saveText}>
              {t((draft ?? '').trim() === '' && current ? 'client.mood.journal.loadDelete' : 'client.mood.journal.loadSave')}
            </Text>
          </Pressable>
          {past.map((load) => (
            <View key={load.id} style={styles.item}>
              <Text style={styles.itemMeta}>{t('client.mood.weeklyReport.weekOf', { date: load.weekStartDate })}</Text>
              <Text style={styles.itemText}>{load.content}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 14,
  },
  empty: { color: LIGHT.textMuted, fontSize: 12 },
  input: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    minHeight: 96,
    padding: 10,
  },
  item: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusMd, gap: 4, padding: 10 },
  itemMeta: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '700' },
  itemText: { color: LIGHT.textStrong, fontSize: 13 },
  list: { gap: 10 },
  loadTitle: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '800' },
  save: { alignItems: 'center', backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusMd, paddingVertical: 12 },
  saveOff: { opacity: 0.45 },
  saveText: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '700' },
  tab: { alignItems: 'center', borderRadius: LIGHT.radiusMd, flex: 1, paddingVertical: 8 },
  tabOn: { backgroundColor: LIGHT.accent },
  tabText: { color: LIGHT.text, fontSize: 13, fontWeight: '700' },
  tabTextOn: { color: LIGHT.textOnNavy },
  tabs: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusMd, flexDirection: 'row', gap: 4, padding: 4 },
});
