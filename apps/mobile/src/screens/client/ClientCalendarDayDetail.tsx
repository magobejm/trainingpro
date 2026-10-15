import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { DayData, PlanDayView } from './client-calendar.helpers';
import { MOOD_EMOJI } from './client-calendar.helpers';
import { CalendarWorkoutList } from './ClientCalendarWorkouts';
import { CLIENT_NOTE_COLOR, COACH_NOTE_COLOR } from './calendar-fixed-colors';
import { CalendarCallPanel } from './ClientCalendarCallPanel';
import { useSaveClientDayNoteMutation } from '../../data/hooks/useClientCalendar';
import { LIGHT } from '../../theme/light';

type DayDetailModalProps = {
  data: DayData | undefined;
  dateStr: string;
  onClose: () => void;
  onOpenPlanDay?: (planDayId: string, view: PlanDayView) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenTest?: (scheduleId: string) => void;
  exerciseCountFor: (planDayId: string | null) => number | null;
};

const MODAL_ANIM = 'fade' as const;
const PLACEHOLDER_NOTE = '#fde68a';
const TEXT_LIGHT = '#f8fafc';

export function DayDetailModal({
  data,
  dateStr,
  exerciseCountFor,
  onClose,
  onOpenPlanDay,
  onOpenSession,
  onOpenTest,
}: DayDetailModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const date = new Date(`${dateStr}T12:00:00`);
  const dateLabel = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', weekday: 'long' });
  const moodEmoji = data?.mood !== null && data?.mood !== undefined ? (MOOD_EMOJI[data.mood] ?? null) : null;
  const hasWorkout = (data?.workouts.length ?? 0) > 0;

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <View style={styles.card}>
        <ScrollView>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.badge}>
              {hasWorkout ? t('client.calendar.chip.workout') : t('client.calendar.chip.rest')}
            </Text>
          </View>
          {data?.physicalTest ? (
            <Pressable onPress={() => onOpenTest?.(data.physicalTest!.scheduleId)} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{data.physicalTest.name}</Text>
              <Text style={styles.summaryHint}>{t('client.calendar.chip.test')}</Text>
            </Pressable>
          ) : null}
          <CalendarWorkoutList
            data={data}
            dateStr={dateStr}
            exerciseCountFor={exerciseCountFor}
            onOpenPlanDay={(planDayId, view) => onOpenPlanDay?.(planDayId, view)}
            onOpenSession={onOpenSession}
          />
          {moodEmoji ? <Text style={styles.mood}>{moodEmoji}</Text> : null}
          <CoachNotes notes={data?.coachNotes ?? []} />
          <ClientNoteEditor dateStr={dateStr} initial={data?.clientNote ?? ''} />
          <CalendarCallPanel call={data?.call ?? null} dateStr={dateStr} scheduledCall={data?.scheduledCall ?? null} />
        </ScrollView>
        <Pressable onPress={onClose} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>{t('client.calendar.detail.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function CoachNotes(props: { notes: string[] }): React.JSX.Element | null {
  const { t } = useTranslation();
  if (props.notes.length === 0) return null;
  return (
    <View style={[styles.block, { backgroundColor: COACH_NOTE_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.coachNotes')}</Text>
      {props.notes.map((note) => (
        <Text key={note} style={styles.blockText}>
          {note}
        </Text>
      ))}
    </View>
  );
}

export function ClientNoteEditor(props: { dateStr: string; initial: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({ date: props.dateStr, dirty: false, saved: false, text: props.initial });
  if (draft.date !== props.dateStr) {
    setDraft({ date: props.dateStr, dirty: false, saved: false, text: props.initial });
  } else if (!draft.dirty && draft.text !== props.initial) {
    setDraft({ ...draft, text: props.initial });
  }
  const content = draft.date === props.dateStr ? draft.text : props.initial;
  const saved = draft.date === props.dateStr && draft.saved;
  const save = useSaveClientDayNoteMutation();
  return (
    <View style={[styles.block, { backgroundColor: CLIENT_NOTE_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.myNotes')}</Text>
      <TextInput
        multiline
        onChangeText={(text) => setDraft({ date: props.dateStr, dirty: true, saved: false, text })}
        placeholder={t('client.calendar.detail.myNotesPlaceholder')}
        placeholderTextColor={PLACEHOLDER_NOTE}
        style={styles.noteInput}
        value={content}
      />
      <Pressable
        onPress={() =>
          save.mutate(
            { content, date: props.dateStr },
            { onSuccess: () => setDraft({ date: props.dateStr, dirty: true, saved: true, text: content }) },
          )
        }
        style={styles.blockButton}
      >
        <Text style={styles.blockButtonText}>{t('client.calendar.detail.saveNote')}</Text>
      </Pressable>
      {saved ? <Text style={styles.blockText}>{t('client.calendar.detail.noteSaved')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: LIGHT.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  block: { borderRadius: 12, marginTop: 10, padding: 12 },
  blockButton: { backgroundColor: '#ffffff22', borderRadius: 10, marginTop: 8, paddingVertical: 8 },
  blockButtonText: { color: TEXT_LIGHT, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  blockText: { color: TEXT_LIGHT, fontSize: 13, marginTop: 4 },
  blockTitle: { color: TEXT_LIGHT, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusSm,
    marginTop: 12,
    paddingVertical: 12,
  },
  btnPrimaryText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    bottom: 40,
    elevation: 8,
    left: 20,
    padding: 20,
    position: 'absolute',
    right: 20,
    top: 60,
  },
  chip: { backgroundColor: '#ffffff22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipText: { color: TEXT_LIGHT, fontSize: 12 },
  closeBtn: { alignItems: 'center', marginTop: 12 },
  closeBtnText: { color: LIGHT.textMuted, fontSize: 16 },
  badge: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    color: LIGHT.accentDark,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateLabel: { color: LIGHT.accent, fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  dayTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 28, fontWeight: '800' },
  summaryCard: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  summaryHint: { color: LIGHT.textMuted, fontSize: 12, marginTop: 2 },
  summaryTitle: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '700' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  mood: { fontSize: 24, marginTop: 4 },
  noteInput: { color: TEXT_LIGHT, fontSize: 13, minHeight: 60 },
  section: { marginBottom: 8 },
  sectionTitle: { color: LIGHT.textMuted, fontSize: 12, marginBottom: 2 },
  sectionValue: { color: LIGHT.textStrong, fontSize: 15 },
  shift: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '600', marginTop: 4 },
});
