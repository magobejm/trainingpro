import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import '../../i18n';
import type { ClientWellnessSession, ClientWellnessWeeklyLoad } from '../../data/hooks/useClientWellness';

type AdherenceProps = {
  nutritionAssigned: boolean;
  nutritionPercent: null | number;
  trainingAssigned: boolean;
  trainingPercent: null | number;
};

export function MoodAdherenceCards(props: AdherenceProps): React.JSX.Element {
  const { t } = useTranslation();
  const items = [
    { assigned: props.trainingAssigned, id: 'training', percent: props.trainingPercent },
    { assigned: props.nutritionAssigned, id: 'nutrition', percent: props.nutritionPercent },
  ];
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.id} style={styles.adherenceCard}>
          <Text style={styles.adherenceLabel}>{t(`coach.mood.adherence.${item.id}`)}</Text>
          <Text style={[styles.adherenceValue, item.assigned ? null : styles.adherenceMuted]}>
            {item.assigned
              ? item.percent === null
                ? '–'
                : `${Math.round(item.percent)}%`
              : t('coach.mood.adherence.notAssigned')}
          </Text>
          <Text style={styles.adherenceLabel}>{t('coach.mood.adherence.period')}</Text>
        </View>
      ))}
    </View>
  );
}

type JournalProps = { sessions: ClientWellnessSession[]; weeklyLoads: ClientWellnessWeeklyLoad[] };
type Tab = 'comments' | 'load';

export function MoodJournalTabs(props: JournalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('comments');
  const comments = props.sessions.filter((s) => s.finishComment !== null && s.finishComment.trim() !== '');
  return (
    <View style={styles.card}>
      <View style={styles.tabs}>
        {(['comments', 'load'] as const).map((key) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key ? styles.tabOn : null]}>
            <Text style={[styles.tabText, tab === key ? styles.tabTextOn : null]}>{t(`coach.mood.journal.${key}`)}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'comments' ? (
        <View style={styles.list}>
          {comments.length === 0 ? <Text style={styles.muted}>{t('coach.mood.journal.commentsEmpty')}</Text> : null}
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
          <Text style={styles.muted}>{t('coach.mood.journal.loadHelp')}</Text>
          {props.weeklyLoads.length === 0 ? <Text style={styles.muted}>{t('coach.mood.journal.loadEmpty')}</Text> : null}
          {props.weeklyLoads.map((load) => (
            <View key={load.id} style={styles.item}>
              <Text style={styles.itemMeta}>{t('coach.mood.weeklyReport.weekOf', { date: load.weekStartDate })}</Text>
              <Text style={styles.itemText}>{load.content}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  adherenceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: space.xs,
    minWidth: 180,
    padding: space.md,
  },
  adherenceLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  adherenceMuted: { color: colors.textMuted, fontSize: fontSize.md },
  adherenceValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  item: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, gap: space.xs, padding: space.md },
  itemMeta: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  itemText: { color: colors.text, fontSize: fontSize.sm },
  list: { gap: space.sm },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tab: { alignItems: 'center', borderRadius: radius.md, flex: 1, paddingVertical: space.sm },
  tabOn: { backgroundColor: colors.primary },
  tabText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  tabTextOn: { color: colors.surface },
  tabs: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
  },
});
