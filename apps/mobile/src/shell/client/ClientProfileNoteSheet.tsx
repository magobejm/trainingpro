import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';
import { commitProfileNote } from './client-profile-edit';

type Props = {
  onClose: () => void;
  onSave: (value: string | null) => Promise<unknown>;
  title: string;
  value: string | null;
  visible: boolean;
};

export function ClientProfileNoteSheet(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(props.value ?? '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!props.visible) return;
    setDraft(props.value ?? '');
    setMessage('');
  }, [props.value, props.visible]);
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.title}</Text>
          <TextInput
            editable={!saving}
            maxLength={2000}
            multiline
            onChangeText={setDraft}
            placeholder={t('mobile.client.profile.noteEmpty')}
            placeholderTextColor={LIGHT.textMuted}
            style={styles.input}
            textAlignVertical={'top'}
            value={draft}
          />
          {message ? <Text style={styles.error}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable disabled={saving} onPress={props.onClose} style={styles.close}>
              <Text style={styles.closeText}>{t('mobile.client.profile.noteClose')}</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => void persistNote(props, draft, setMessage, setSaving, t)}
              style={styles.save}
            >
              <Text style={styles.saveText}>
                {t(saving ? 'mobile.client.profile.saving' : 'mobile.client.profile.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

async function persistNote(
  props: Props,
  draft: string,
  setMessage: (message: string) => void,
  setSaving: (saving: boolean) => void,
  t: (key: string) => string,
): Promise<void> {
  const parsed = commitProfileNote(props.value, draft);
  if ('error' in parsed) {
    setMessage(t('mobile.client.profile.invalid'));
    return;
  }
  if ('skip' in parsed) {
    props.onClose();
    return;
  }
  setSaving(true);
  try {
    await props.onSave(parsed.value);
    props.onClose();
  } catch {
    setMessage(t('mobile.client.profile.saveError'));
  } finally {
    setSaving(false);
  }
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  backdrop: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusLg, gap: 12, maxWidth: 480, padding: 16, width: '100%' },
  close: {
    alignItems: 'center',
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  closeText: { color: LIGHT.textStrong, fontWeight: '700' },
  error: { color: LIGHT.red, fontSize: 13 },
  input: {
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    padding: 12,
  },
  save: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusFull,
    flex: 1,
    paddingVertical: 12,
  },
  saveText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '700' },
});
