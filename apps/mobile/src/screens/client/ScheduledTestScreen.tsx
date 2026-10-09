import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  usePhysicalTestSchedulesQuery,
  type PhysicalTestResultView,
  type RecordPhysicalTestInput,
} from '../../data/hooks/usePhysicalTests';
import { PhysicalTestResultForm } from './physical-test-result-form';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type Props = {
  onClose: () => void;
  onOpenHistory: () => void;
  scheduleId: string;
};

const RANGE_FROM = '2020-01-01';
const RANGE_TO = '2035-12-31';

export function ScheduledTestScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = usePhysicalTestSchedulesQuery(RANGE_FROM, RANGE_TO);
  const schedule = (query.data ?? []).find((item) => item.id === props.scheduleId) ?? null;
  const [saved, setSaved] = useState<PhysicalTestResultView | null>(null);
  const result = saved ?? schedule?.result ?? null;

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={props.onClose} title={t('client.physicalTests.scheduledTitle')} />
      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? (
          <ActivityIndicator color={LIGHT.accent} />
        ) : schedule ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroMeta}>{`${schedule.physicalTest.category} · ${schedule.physicalTest.level}`}</Text>
              <Text style={styles.heroTitle}>{schedule.physicalTest.name}</Text>
              <Text style={styles.heroBody}>{schedule.physicalTest.objective}</Text>
            </View>
            <Info title={t('client.physicalTests.objective')} text={schedule.physicalTest.objective} />
            <Info title={t('client.physicalTests.whatToDo')} text={schedule.physicalTest.whatToDo} />
            <Info title={t('client.physicalTests.whatToMeasure')} text={schedule.physicalTest.whatToMeasure} />
            {schedule.physicalTest.options ? (
              <Info
                title={t('client.physicalTests.material')}
                text={`${schedule.physicalTest.options.economic}\n${schedule.physicalTest.options.pro}`}
              />
            ) : null}
            {result ? (
              <RecordedData onOpenHistory={props.onOpenHistory} result={result} t={t} />
            ) : (
              <PhysicalTestResultForm
                onSaved={setSaved}
                scheduleId={schedule.id}
                testId={schedule.physicalTest.id}
                testName={schedule.physicalTest.name}
              />
            )}
          </>
        ) : (
          <Text style={styles.empty}>{t('client.physicalTests.error')}</Text>
        )}
      </ScrollView>
      {saved ? (
        <View style={styles.savedCard}>
          <Text style={styles.savedTitle}>{t('client.physicalTests.savedTitle')}</Text>
          <Text style={styles.savedScore}>{saved.rawScore}</Text>
          <Pressable onPress={props.onClose} style={styles.primary}>
            <Text style={styles.primaryText}>{t('client.physicalTests.backToRoutine')}</Text>
          </Pressable>
          <Pressable onPress={props.onOpenHistory} style={styles.secondary}>
            <Text style={styles.secondaryText}>{t('client.physicalTests.tabHistory')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Info(props: { text: string; title: string }): React.JSX.Element {
  return (
    <View style={styles.info}>
      <Text style={styles.infoTitle}>{props.title}</Text>
      <Text style={styles.infoText}>{props.text}</Text>
    </View>
  );
}

function RecordedData(props: {
  onOpenHistory: () => void;
  result: PhysicalTestResultView;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.info}>
      <Text style={styles.infoTitle}>{props.t('client.physicalTests.recordedData')}</Text>
      <Text style={styles.savedScore}>{props.result.rawScore}</Text>
      <Text style={styles.infoText}>{formatInputs(props.result.inputsJson)}</Text>
      <Pressable onPress={props.onOpenHistory} style={styles.secondary}>
        <Text style={styles.secondaryText}>{props.t('client.physicalTests.tabHistory')}</Text>
      </Pressable>
    </View>
  );
}

function formatInputs(inputs: RecordPhysicalTestInput): string {
  return Object.entries(inputs)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

const styles = StyleSheet.create({
  container: SCREEN.root,
  content: { gap: 12, padding: 16, paddingBottom: 40 },
  empty: { color: LIGHT.textMuted, textAlign: 'center' },
  hero: { backgroundColor: '#1e1b4b', borderRadius: 20, gap: 6, padding: 16 },
  heroBody: { color: '#c7d2fe', fontSize: 13, lineHeight: 18 },
  heroMeta: { color: '#a5b4fc', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  info: { backgroundColor: LIGHT.bgCard, borderColor: LIGHT.border, borderRadius: 16, borderWidth: 1, gap: 6, padding: 14 },
  infoText: { color: LIGHT.textStrong, fontSize: 14, lineHeight: 20 },
  infoTitle: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  primary: { alignItems: 'center', backgroundColor: LIGHT.accent, borderRadius: 12, paddingVertical: 12 },
  primaryText: { color: LIGHT.textOnNavy, fontWeight: '800' },
  savedCard: { backgroundColor: LIGHT.bgCard, borderTopColor: LIGHT.border, borderTopWidth: 1, gap: 8, padding: 16 },
  savedScore: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
  savedTitle: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800' },
  secondary: { alignItems: 'center', backgroundColor: LIGHT.accentSoft, borderRadius: 12, paddingVertical: 12 },
  secondaryText: { color: LIGHT.accentDark, fontWeight: '700' },
});
