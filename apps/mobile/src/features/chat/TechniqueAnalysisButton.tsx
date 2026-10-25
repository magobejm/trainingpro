import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import { isTechniqueResult, type CoachTechniqueResult } from '../coach/coach-evaluator-model';
import { EvaluatorResult } from '../coach/EvaluatorResult';

/** Coach-only action over a received chat video/image: runs the Gemini technique evaluator on it. */
export function TechniqueAnalysisButton(props: { attachmentId: string; exerciseName?: string }): React.JSX.Element | null {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const [open, setOpen] = useState(false);
  const analyze = useMutation<CoachTechniqueResult, Error>({
    networkMode: 'always',
    retry: false,
    mutationFn: async () => {
      if (!accessToken || activeRole !== 'coach') throw new Error('Missing authenticated context');
      const result = await createApiClient({ accessToken, activeRole }).post<unknown>('/ai-evaluator/analyze-attachment', {
        attachmentId: props.attachmentId,
        exerciseName: props.exerciseName,
      });
      if (!isTechniqueResult(result)) throw new Error(t('coach.chat.analyzeTechnique.incomplete'));
      return result;
    },
  });
  if (activeRole !== 'coach') return null;
  const run = () => {
    setOpen(true);
    if (!analyze.data && !analyze.isPending) analyze.mutate();
  };
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={run} style={styles.button}>
        <Text style={styles.buttonText}>{t('coach.chat.analyzeTechnique.button')}</Text>
      </Pressable>
      <Modal animationType={'slide'} onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.body}>
              {analyze.isPending ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>{t('coach.chat.analyzeTechnique.loading')}</Text>
                </View>
              ) : null}
              {analyze.isError ? (
                <View style={styles.center}>
                  <Text accessibilityRole="alert" style={styles.error}>
                    {analyze.error.message || t('coach.chat.analyzeTechnique.error')}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={() => analyze.mutate()} style={styles.button}>
                    <Text style={styles.buttonText}>{t('coach.chat.analyzeTechnique.retry')}</Text>
                  </Pressable>
                </View>
              ) : null}
              {analyze.data ? <EvaluatorResult result={analyze.data} /> : null}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>{t('coach.chat.analyzeTechnique.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: '#0008', flex: 1, justifyContent: 'center', padding: 16 },
  body: { gap: 12, padding: 16 },
  button: { backgroundColor: '#1c74e9', borderRadius: 10, marginTop: 6, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  center: { alignItems: 'center', gap: 8, padding: 16 },
  close: { alignItems: 'center', borderTopColor: '#e2e8f0', borderTopWidth: 1, padding: 14 },
  closeText: { color: '#1c74e9', fontWeight: '800' },
  error: { color: '#b91c1c', textAlign: 'center' },
  muted: { color: '#64748b' },
  sheet: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '90%', width: '100%' },
});
