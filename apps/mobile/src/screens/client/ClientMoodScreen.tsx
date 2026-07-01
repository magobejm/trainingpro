import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientWellnessQuery } from '../../data/hooks/useClientWellness';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { MoodKpiStrip } from './ClientMoodKpiStrip';
import { MoodSessionList } from './ClientMoodSessionList';
import { MoodWeeklyReports } from './ClientMoodWeeklyReports';
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

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.mood.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('client.mood.subtitle')}</Text>
        {renderBody(query, t)}
      </ScrollView>
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
      <View style={styles.hint}>
        <Text style={styles.hintText}>{t('client.mood.readOnlyHint')}</Text>
      </View>
      <MoodKpiStrip summary={summary} />
      <MoodSessionList sessions={sessions} />
      <MoodWeeklyReports reports={weeklyReports} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 200, padding: 24 },
  container: SCREEN.root,
  content: { paddingBottom: 32 },
  empty: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 14, textAlign: 'center' },
  hint: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
  },
  hintText: { color: LIGHT.accentDark, fontSize: 12, textAlign: 'center' },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, paddingHorizontal: 16 },
});
