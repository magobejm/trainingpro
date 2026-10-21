import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { useWorkoutGuide } from './WorkoutGuideContext';
import { GuideButton } from './WorkoutGuideCard';
import { WorkoutGuideChat } from './WorkoutGuideChat';

export function WorkoutHelpScreen({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const guide = useWorkoutGuide();
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <GuideButton label={'back'} secondary onPress={onClose} />
        <Text accessibilityRole={'header'} style={styles.title}>
          {t('mobile.guide.helpTitle')}
        </Text>
        <Text style={styles.text}>{t('mobile.guide.helpIntro')}</Text>
        {['record', 'save', 'sync', 'help'].map((step) => (
          <View key={step} style={styles.card}>
            <Text style={styles.heading}>{t(`mobile.guide.${step}.title`)}</Text>
            <Text style={styles.text}>{t(`mobile.guide.${step}.body`)}</Text>
          </View>
        ))}
        <GuideButton
          label={'replay'}
          onPress={() => {
            void guide.startFromHelp().then((started) => {
              if (started) onClose();
            });
          }}
        />
        <Text style={styles.text}>{t('mobile.guide.nextSession')}</Text>
        {guide.error ? (
          <>
            <Text style={styles.text}>{t('mobile.guide.preferenceError')}</Text>
            <GuideButton label={'retry'} secondary onPress={() => void guide.refresh()} />
          </>
        ) : guide.pending ? (
          <Text style={styles.text}>{t('mobile.guide.preferencePending')}</Text>
        ) : null}
        <GuideButton label={'chat'} secondary onPress={() => setChatOpen(true)} />
      </ScrollView>
      <WorkoutGuideChat visible={chatOpen} onClose={() => setChatOpen(false)} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT.bgSoft },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  title: { color: LIGHT.textStrong, fontSize: 26, fontWeight: '800' },
  heading: { color: LIGHT.textStrong, fontSize: 17, fontWeight: '700' },
  text: { color: LIGHT.text, fontSize: 15, lineHeight: 23 },
  card: { padding: 16, backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusMd, gap: 8 },
});
