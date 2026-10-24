import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientCalendarEventsQuery, useSaveClientDayNoteMutation } from '../../data/hooks/useClientCalendar';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { LIGHT } from '../../theme/light';
import { dayLabel, shiftDate } from './client-notes.helpers';

type Props = {
  date: string;
  knownContent: string | null;
  onClose: () => void;
  onShift: (date: string) => void;
};

const SPINNER_COLOR = LIGHT.accent;

export function ClientNoteDayEditor(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const calendar = useClientCalendarEventsQuery(props.date, props.date);
  const remote = calendar.data?.data.find((event) => event.type === 'client_note')?.content ?? null;
  if (props.knownContent === null && calendar.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={SPINNER_COLOR} />
      </View>
    );
  }
  if (props.knownContent === null && calendar.isError) {
    return (
      <View style={styles.screen}>
        <OverlayBackHeader onClose={props.onClose} title={t('client.diary.title')} />
        <Text style={styles.error}>{t('client.diary.loadError')}</Text>
      </View>
    );
  }
  return (
    <NoteDraft
      content={props.knownContent ?? remote ?? ''}
      date={props.date}
      key={props.date}
      onClose={props.onClose}
      onShift={props.onShift}
    />
  );
}

function NoteDraft(props: {
  content: string;
  date: string;
  onClose: () => void;
  onShift: (date: string) => void;
}): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const save = useSaveClientDayNoteMutation();
  const [draft, setDraft] = useState(props.content);
  const [saved, setSaved] = useState(false);
  const label = dayLabel(props.date, i18n.language);
  return (
    <View style={styles.screen}>
      <OverlayBackHeader onClose={props.onClose} title={label} />
      <View style={styles.nav}>
        <Pressable onPress={() => props.onShift(shiftDate(props.date, -1))} style={styles.navButton}>
          <Text style={styles.navText}>{t('client.diary.previousDay')}</Text>
        </Pressable>
        <Pressable onPress={() => props.onShift(shiftDate(props.date, 1))} style={styles.navButton}>
          <Text style={styles.navText}>{t('client.diary.nextDay')}</Text>
        </Pressable>
      </View>
      <TextInput
        multiline
        onChangeText={(value) => {
          setDraft(value);
          setSaved(false);
        }}
        placeholder={t('client.diary.placeholder')}
        placeholderTextColor={LIGHT.textMuted}
        style={styles.input}
        textAlignVertical={'top'}
        value={draft}
      />
      <Pressable
        onPress={() => save.mutate({ content: draft, date: props.date }, { onSuccess: () => setSaved(true) })}
        style={styles.save}
      >
        <Text style={styles.saveText}>{t('client.diary.save')}</Text>
      </Pressable>
      {saved ? <Text style={styles.saved}>{t('client.diary.saved')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: LIGHT.textMuted, marginHorizontal: 16, marginTop: 24, textAlign: 'center' },
  input: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 12,
    borderWidth: 1,
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 16,
    marginHorizontal: 16,
    padding: 14,
  },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  nav: { flexDirection: 'row', gap: 8, marginBottom: 12, marginHorizontal: 16 },
  navButton: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 10,
  },
  navText: { color: LIGHT.accent, fontWeight: '700', textAlign: 'center' },
  save: {
    backgroundColor: LIGHT.accent,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
  },
  saveText: { color: LIGHT.textOnNavy, fontWeight: '700', textAlign: 'center' },
  saved: { color: LIGHT.emerald, fontWeight: '600', marginVertical: 10, textAlign: 'center' },
  screen: { backgroundColor: LIGHT.bg, flex: 1, paddingBottom: 24 },
});
