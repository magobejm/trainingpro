import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientWellnessQuery } from '../../data/hooks/useClientWellness';
import {
  useUpsertWeeklyReportMutation,
  useWeeklyReportQuery,
  type UpsertWeeklyReportInput,
} from '../../data/hooks/useWeeklyReport';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { showError, showToast } from '../../shell/client/feedback';
import { MoodKpiStrip } from './ClientMoodKpiStrip';
import { MoodSessionList } from './ClientMoodSessionList';
import { MoodWeeklyReports } from './ClientMoodWeeklyReports';
import { WeeklyReportFormSheet } from './WeeklyReportFormSheet';
import { buildDefaultWellnessRange } from './client-mood.helpers';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type Props = { onClose: () => void };

const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;

export function ClientMoodScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const range = useMemo(() => buildDefaultWellnessRange(), []);
  const query = useClientWellnessQuery(range.dateFrom, range.dateTo);
  const reportDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weeklyQuery = useWeeklyReportQuery(reportDate);
  const weeklyMutation = useUpsertWeeklyReportMutation();
  const [formOpen, setFormOpen] = useState(false);

  const onSubmit = async (input: UpsertWeeklyReportInput) => {
    try {
      await weeklyMutation.mutateAsync(input);
      showToast(t('client.report.saved'));
      setFormOpen(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('client.mood.error'));
    }
  };

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.mood.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('client.mood.subtitle')}</Text>
        <Pressable onPress={() => setFormOpen(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{t('client.mood.addWeeklyReport')}</Text>
        </Pressable>
        {renderBody(query, t)}
      </ScrollView>
      <WeeklyReportFormSheet
        initial={weeklyQuery.data ?? null}
        isSubmitting={weeklyMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => void onSubmit(input)}
        reportDate={reportDate}
        visible={formOpen}
      />
    </View>
  );
}

function renderBody(query: ReturnType<typeof useClientWellnessQuery>, t: (key: string) => string): React.JSX.Element {
  if (query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
      </View>
    );
  }
  if (query.isError || !query.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('client.mood.error')}</Text>
      </View>
    );
  }

  const { summary, sessions, weeklyReports } = query.data;
  const isEmpty = summary.sessionsWithWellness === 0 && summary.reportsCount === 0;

  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('client.mood.empty')}</Text>
      </View>
    );
  }

  return (
    <>
      <MoodKpiStrip summary={summary} />
      <MoodSessionList sessions={sessions} />
      <MoodWeeklyReports reports={weeklyReports} />
    </>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginBottom: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 200, padding: 24 },
  container: SCREEN.root,
  content: { paddingBottom: 32 },
  empty: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 14, textAlign: 'center' },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, paddingHorizontal: 16 },
});
