import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UpsertWeeklyReportInput, WeeklyReportView } from '../../data/hooks/useWeeklyReport';
import { LIGHT } from '../../theme/light';
import { WellnessScoreRow } from './WellnessScoreRow';

type Props = {
  initial: null | WeeklyReportView;
  isSubmitting: boolean;
  reportDate: string;
  sourceSessionId?: null | string;
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: UpsertWeeklyReportInput) => void;
};

const DEFAULT_SCORE = 5;
const KEYBOARD_DECIMAL = 'decimal-pad' as const;
const KEYBOARD_NUMBER = 'number-pad' as const;
const TAPS_HANDLED = 'handled' as const;

export function WeeklyReportFormSheet(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [mood, setMood] = useState(DEFAULT_SCORE);
  const [energy, setEnergy] = useState(DEFAULT_SCORE);
  const [sleepHours, setSleepHours] = useState('');
  const [adherence, setAdherence] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!props.visible) return;
    setMood(props.initial?.mood ?? DEFAULT_SCORE);
    setEnergy(props.initial?.energy ?? DEFAULT_SCORE);
    setSleepHours(props.initial?.sleepHours != null ? String(props.initial.sleepHours) : '');
    setAdherence(props.initial?.adherencePercent != null ? String(props.initial.adherencePercent) : '');
    setNotes(props.initial?.notes ?? '');
  }, [props.initial, props.visible]);

  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <Pressable onPress={props.onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps={TAPS_HANDLED}>
            <Text style={styles.title}>{t('client.report.title')}</Text>
            <Text style={styles.subtitle}>{t('client.report.subtitle')}</Text>
            <WellnessScoreRow label={t('client.report.mood')} onChange={setMood} value={mood} />
            <WellnessScoreRow label={t('client.report.energy')} onChange={setEnergy} value={energy} />
            <Text style={styles.fieldLabel}>{t('client.report.sleepHours')}</Text>
            <TextInput
              keyboardType={KEYBOARD_DECIMAL}
              onChangeText={setSleepHours}
              placeholderTextColor={LIGHT.textMuted}
              style={styles.input}
              value={sleepHours}
            />
            <Text style={styles.fieldLabel}>{t('client.report.adherence')}</Text>
            <TextInput
              keyboardType={KEYBOARD_NUMBER}
              onChangeText={setAdherence}
              placeholderTextColor={LIGHT.textMuted}
              style={styles.input}
              value={adherence}
            />
            <Text style={styles.fieldLabel}>{t('client.report.notes')}</Text>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder={t('client.report.notesPlaceholder')}
              placeholderTextColor={LIGHT.textMuted}
              style={[styles.input, styles.notes]}
              value={notes}
            />
            <View style={styles.actions}>
              <Pressable disabled={props.isSubmitting} onPress={props.onClose} style={styles.skipBtn}>
                <Text style={styles.skipText}>{t('client.report.close')}</Text>
              </Pressable>
              <Pressable
                disabled={props.isSubmitting}
                onPress={() => props.onSubmit(buildPayload(props, mood, energy, sleepHours, adherence, notes))}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>{t('client.report.submit')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function buildPayload(
  props: Props,
  mood: number,
  energy: number,
  sleepHours: string,
  adherence: string,
  notes: string,
): UpsertWeeklyReportInput {
  return {
    adherencePercent: parseOptionalNumber(adherence, 0, 100),
    energy,
    mood,
    notes: notes.trim() || null,
    reportDate: props.reportDate,
    sleepHours: parseOptionalNumber(sleepHours, 0, 24),
    sourceSessionId: props.sourceSessionId ?? null,
  };
}

function parseOptionalNumber(raw: string, min: number, max: number): null | number {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  fieldLabel: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    marginTop: 6,
    padding: 12,
  },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  saveText: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '700' },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    maxHeight: '90%',
    padding: 24,
    width: '100%',
  },
  skipBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  skipText: { color: LIGHT.accentDark, fontSize: 14, fontWeight: '700' },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12 },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
});
