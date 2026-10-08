import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { weekdayName } from '@trainerpro/shared';
import type { DayData } from './client-calendar.helpers';
import { MOOD_EMOJI } from './client-calendar.helpers';
import {
  CALL_COLOR,
  CALL_REQUEST_COLOR,
  CLIENT_NOTE_COLOR,
  COACH_NOTE_COLOR,
  QUICK_CALL_TIMES,
  callTimeOptions,
} from './calendar-fixed-colors';
import { useCreateCallProposalMutation, useSaveClientDayNoteMutation } from '../../data/hooks/useClientCalendar';
import { LIGHT } from '../../theme/light';

type DayDetailModalProps = {
  data: DayData | undefined;
  dateStr: string;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
};

const MODAL_ANIM = 'fade' as const;
const PLACEHOLDER_NOTE = '#fde68a';
const TEXT_LIGHT = '#f8fafc';

export function DayDetailModal({ data, dateStr, onClose, onOpenSession }: DayDetailModalProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const date = new Date(dateStr);
  const dateLabel = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', weekday: 'long' });
  const trainingTitle = data?.planDayTitle ?? (data?.hasPlanned || data?.hasCompleted ? '—' : null);
  const moodEmoji = data?.mood !== null && data?.mood !== undefined ? (MOOD_EMOJI[data.mood] ?? null) : null;

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <View style={styles.card}>
        <ScrollView>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <TrainingSection data={data} moodEmoji={moodEmoji} title={trainingTitle} t={t} language={i18n.language} />
          <CoachNotes notes={data?.coachNotes ?? []} />
          {data?.call ? <CallBlock time={data.call.time} /> : null}
          <ClientNoteEditor dateStr={dateStr} initial={data?.clientNote ?? ''} />
          <CallRequest dateStr={dateStr} />
          {data?.sessionId ? (
            <Pressable onPress={() => onOpenSession(data.sessionId!)} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>{t('client.calendar.detail.viewSession')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>{'✕'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function TrainingSection(props: {
  data: DayData | undefined;
  language: string;
  moodEmoji: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
  title: string | null;
}): React.JSX.Element {
  const { data, t } = props;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('client.calendar.detail.training')}</Text>
      <Text style={styles.sectionValue}>{props.title ?? t('client.calendar.detail.rest')}</Text>
      {props.moodEmoji ? <Text style={styles.mood}>{props.moodEmoji}</Text> : null}
      {data?.hasCompleted ? <Text style={styles.shift}>{t('client.calendar.workout.done')}</Text> : null}
      {data?.hasCompleted && data.shift && data.originDate ? (
        <Text style={styles.shift}>
          {t(`client.calendar.workout.${data.shift}`, { day: weekdayName(data.originDate, props.language) })}
        </Text>
      ) : null}
    </View>
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

function CallBlock(props: { time: string }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={[styles.block, { backgroundColor: CALL_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.callScheduled')}</Text>
      <Text style={styles.blockText}>{t('client.calendar.detail.callWith', { time: props.time })}</Text>
    </View>
  );
}

function ClientNoteEditor(props: { dateStr: string; initial: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [content, setContent] = useState(props.initial);
  const [saved, setSaved] = useState(false);
  const save = useSaveClientDayNoteMutation();
  return (
    <View style={[styles.block, { backgroundColor: CLIENT_NOTE_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.myNotes')}</Text>
      <TextInput
        multiline
        onChangeText={setContent}
        placeholder={t('client.calendar.detail.myNotesPlaceholder')}
        placeholderTextColor={PLACEHOLDER_NOTE}
        style={styles.noteInput}
        value={content}
      />
      <Pressable
        onPress={() => save.mutate({ content, date: props.dateStr }, { onSuccess: () => setSaved(true) })}
        style={styles.blockButton}
      >
        <Text style={styles.blockButtonText}>{t('client.calendar.detail.saveNote')}</Text>
      </Pressable>
      {saved ? <Text style={styles.blockText}>{t('client.calendar.detail.noteSaved')}</Text> : null}
    </View>
  );
}

function CallRequest(props: { dateStr: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [time, setTime] = useState('17:15');
  const [sent, setSent] = useState(false);
  const propose = useCreateCallProposalMutation();
  return (
    <View style={[styles.block, { backgroundColor: CALL_REQUEST_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.scheduleCall')}</Text>
      <View style={styles.chips}>
        {QUICK_CALL_TIMES.map((option) => (
          <Pressable key={option} onPress={() => setTime(option)} style={styles.chip}>
            <Text style={styles.chipText}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <TimeSelect onChange={setTime} value={time} />
      <Pressable
        onPress={() => propose.mutate({ date: props.dateStr, time }, { onSuccess: () => setSent(true) })}
        style={styles.blockButton}
      >
        <Text style={styles.blockButtonText}>{t('client.calendar.detail.sendToCoach')}</Text>
      </Pressable>
      {sent ? <Text style={styles.blockText}>{t('client.calendar.detail.callSent', { time })}</Text> : null}
    </View>
  );
}

function TimeSelect(props: { onChange: (time: string) => void; value: string }): React.JSX.Element {
  return (
    <select onChange={(event) => props.onChange(event.target.value)} style={selectStyle} value={props.value}>
      {callTimeOptions().map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const selectStyle = { borderRadius: 8, marginTop: 8, padding: 6 } as const;

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
  dateLabel: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '600', marginBottom: 12, textTransform: 'capitalize' },
  mood: { fontSize: 24, marginTop: 4 },
  noteInput: { color: TEXT_LIGHT, fontSize: 13, minHeight: 60 },
  section: { marginBottom: 8 },
  sectionTitle: { color: LIGHT.textMuted, fontSize: 12, marginBottom: 2 },
  sectionValue: { color: LIGHT.textStrong, fontSize: 15 },
  shift: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '600', marginTop: 4 },
});
