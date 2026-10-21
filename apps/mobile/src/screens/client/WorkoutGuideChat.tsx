import React from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChatScreen } from '../shared/ChatScreen';
import { LIGHT } from '../../theme/light';

export function WorkoutGuideChat(props: { visible: boolean; onClose: () => void; context?: string }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Modal animationType={'slide'} visible={props.visible} onRequestClose={props.onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole={'button'} onPress={props.onClose} style={styles.back}>
            <Text style={styles.link}>{t('mobile.guide.backToWorkout')}</Text>
          </Pressable>
          <Text style={styles.hint}>{t('mobile.guide.chatHint')}</Text>
        </View>
        {props.visible ? (
          <ChatScreen
            embedded
            initialMessage={props.context ? t('mobile.guide.chatDraft', { context: props.context }) : undefined}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT.bgCard },
  header: { padding: 16, gap: 4, borderBottomWidth: 1, borderColor: LIGHT.border },
  back: { minHeight: 44, justifyContent: 'center' },
  link: { color: LIGHT.accentDark, fontSize: 16, fontWeight: '700' },
  hint: { color: LIGHT.textMuted, fontSize: 13 },
});
