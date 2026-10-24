import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';

type Props = { body: string | null; onClose: () => void; title: string; visible: boolean };

export function ClientProfileNoteSheet(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.body}>{props.body?.trim() ? props.body : t('mobile.client.profile.noteEmpty')}</Text>
          <Pressable onPress={props.onClose} style={styles.close}>
            <Text style={styles.closeText}>{t('mobile.client.profile.noteClose')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 20 },
  body: { color: LIGHT.text, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusLg, gap: 12, padding: 16, width: '100%' },
  close: { alignItems: 'center', backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusFull, paddingVertical: 12 },
  closeText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '700' },
});
