import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useClientWellnessQuery,
  useMyNutritionAdherenceQuery,
  useMyTrainingAdherenceQuery,
  useSaveWeeklyLoadMutation,
} from '../../data/hooks/useClientWellness';
import { nextWeekStart } from '@trainerpro/shared';
import {
  useUpsertWeeklyReportMutation,
  useWeeklyReportQuery,
  type UpsertWeeklyReportInput,
} from '../../data/hooks/useWeeklyReport';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { showError, showToast } from '../../shell/client/feedback';
import { MoodAdherenceCards } from './ClientMoodAdherenceCards';
import { MoodJournalTabs, type JournalTab } from './ClientMoodJournalTabs';
import { ClientMoodTrendChart } from './ClientMoodTrendChart';
import { localDateKey } from './daily-checkin.utils';
import { MoodWeeklyReports } from './ClientMoodWeeklyReports';
import { WeeklyReportFormSheet } from './WeeklyReportFormSheet';
import { buildDefaultWellnessRange } from './client-mood.helpers';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type Props = { initialTab?: JournalTab; onClose: () => void };

const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;
const ADHERENCE_DAYS = 30;

export function ClientMoodScreen({ initialTab, onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const range = useMemo(() => buildDefaultWellnessRange(), []);
  const query = useClientWellnessQuery(range.dateFrom, range.dateTo);
  const reportDate = useMemo(() => localDateKey(), []);
  const adherenceFrom = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - ADHERENCE_DAYS + 1);
    return localDateKey(from);
  }, []);
  const training = useMyTrainingAdherenceQuery(adherenceFrom, reportDate);
  const nutrition = useMyNutritionAdherenceQuery(adherenceFrom, reportDate);
  const weeklyQuery = useWeeklyReportQuery(reportDate);
  const weeklyMutation = useUpsertWeeklyReportMutation();
  const loadMutation = useSaveWeeklyLoadMutation();
  const [formOpen, setFormOpen] = useState(false);
  const nextWeek = nextWeekStart(reportDate);

  const onSubmit = async (input: UpsertWeeklyReportInput) => {
    try {
      await weeklyMutation.mutateAsync(input);
      showToast(t('client.report.saved'));
      setFormOpen(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('client.mood.error'));
    }
  };

  const onSaveLoad = async (content: string) => {
    try {
      await loadMutation.mutateAsync({ content, weekStartDate: nextWeek });
      showToast(t('client.mood.journal.loadSaved'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('client.mood.error'));
    }
  };

  const data = query.data;
  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.mood.title')} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={'handled'}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{t('client.mood.subtitle')}</Text>
        <MoodAdherenceCards
          nutritionAssigned={nutrition.data?.assigned === true}
          nutritionPercent={nutrition.data?.summary.percent ?? null}
          trainingAssigned={training.data?.assigned === true}
          trainingPercent={training.data?.percent ?? null}
        />
        {query.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
          </View>
        ) : null}
        {query.isError || (!query.isLoading && !data) ? (
          <View style={styles.center}>
            <Text style={styles.error}>{t('client.mood.error')}</Text>
          </View>
        ) : null}
        {data ? (
          <>
            <ClientMoodTrendChart checkins={data.checkins ?? []} endDate={reportDate} sessions={data.sessions} />
            <MoodJournalTabs
              initialTab={initialTab}
              isSaving={loadMutation.isPending}
              nextWeek={nextWeek}
              onSaveLoad={(content) => void onSaveLoad(content)}
              sessions={data.sessions}
              weeklyLoads={data.weeklyLoads ?? []}
            />
            <Pressable onPress={() => setFormOpen(true)} style={styles.addBtn}>
              <Text style={styles.addBtnText}>{t('client.mood.addWeeklyReport')}</Text>
            </Pressable>
            <MoodWeeklyReports reports={data.weeklyReports} />
          </>
        ) : null}
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
