import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { useAnalyzeAttachmentMutation } from '../../../data/hooks/ai/useAnalyzeAttachmentMutation';
import type { TechniqueAnalysisResult } from '../../../data/hooks/ai/useAnalyzeTechniqueMutation';

/** "Analizar técnica con IA" action under a received chat video; shows the Gemini result inline. */
export function ChatTechniqueAnalysis(props: { attachmentId: string; exerciseName?: string }): React.JSX.Element {
  const { t } = useTranslation();
  const mutation = useAnalyzeAttachmentMutation();
  const [open, setOpen] = useState(false);
  const run = () => {
    setOpen(true);
    if (!mutation.data && !mutation.isPending)
      mutation.mutate({ attachmentId: props.attachmentId, exerciseName: props.exerciseName });
  };
  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={run} style={styles.button}>
        <Text style={styles.buttonText}>{t('coach.chat.analyzeTechnique.button')}</Text>
      </Pressable>
      {open ? (
        <View style={styles.panel}>
          {mutation.isPending ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={styles.muted}>{t('coach.chat.analyzeTechnique.loading')}</Text>
            </View>
          ) : null}
          {mutation.isError ? (
            <View>
              <Text accessibilityRole="alert" style={styles.error}>
                {t('coach.chat.analyzeTechnique.error')}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => mutation.mutate({ attachmentId: props.attachmentId, exerciseName: props.exerciseName })}
              >
                <Text style={styles.link}>{t('coach.chat.analyzeTechnique.retry')}</Text>
              </Pressable>
            </View>
          ) : null}
          {mutation.data ? <ResultCard result={mutation.data} /> : null}
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)}>
            <Text style={styles.link}>{t('coach.chat.analyzeTechnique.close')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ResultCard(props: { result: TechniqueAnalysisResult }): React.JSX.Element {
  const { t } = useTranslation();
  const { result } = props;
  const danger = result.score_seguridad < 50;
  return (
    <View style={styles.result}>
      <Text style={styles.resultTitle}>{result.ejercicio}</Text>
      <Text style={styles.muted}>{result.fase_movimiento}</Text>
      <Text style={danger ? styles.error : styles.score}>
        {`${t('app.evaluator.scoreLabel')} ${result.score_seguridad}/100`}
      </Text>
      <Text style={styles.sectionTitle}>{t('app.evaluator.correctionTitle')}</Text>
      <Text style={styles.text}>{result.correccion_inmediata}</Text>
      <Text style={styles.sectionTitle}>{t('app.evaluator.errorsTitle')}</Text>
      {result.errores_detectados.map((item, index) => (
        <Text key={index} style={styles.text}>
          {`• ${item}`}
        </Text>
      ))}
      <Text style={styles.sectionTitle}>{t('app.evaluator.pointsTitle')}</Text>
      <Text style={styles.text}>
        {t('app.evaluator.backLabel')} {result.analisis_puntos_clave.espalda}
      </Text>
      <Text style={styles.text}>
        {t('app.evaluator.rangeLabel')} {result.analisis_puntos_clave.rango_movimiento}
      </Text>
      <Text style={styles.text}>
        {t('app.evaluator.jointsLabel')} {result.analisis_puntos_clave.alineacion_articulaciones}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.primary, borderRadius: radius.md, marginTop: space.sm, padding: space.sm },
  buttonText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '800', textAlign: 'center' },
  error: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700' },
  link: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700', textDecorationLine: 'underline' },
  muted: { color: colors.textMuted, fontSize: fontSize.xs },
  panel: { gap: space.sm, marginTop: space.sm },
  result: { backgroundColor: colors.surface, borderRadius: radius.md, gap: 2, padding: space.sm },
  resultTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  root: { alignSelf: 'stretch' },
  row: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  score: { color: colors.text, fontSize: fontSize.xs, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: fontSize.xs, fontWeight: '800', marginTop: space.sm },
  text: { color: colors.text, fontSize: fontSize.xs },
});
