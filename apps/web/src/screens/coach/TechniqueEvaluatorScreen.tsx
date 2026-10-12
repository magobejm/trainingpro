/* eslint-disable max-lines, max-lines-per-function, no-restricted-syntax, max-len */
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

import { AsyncStatus } from '../../components/AsyncStatus';
import { LOADING_MESSAGE_KEYS, resolveFailureKind } from './technique-evaluator.logic';
import { useAnalyzeTechniqueMutation, type TechniqueAnalysisResult } from '../../data/hooks/ai/useAnalyzeTechniqueMutation';
import type { TFunction } from 'i18next';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';

const EVALUATOR_MAX_BYTES = 20 * 1024 * 1024;

const COLORS = {
  action: colors.primary,
  bg: colors.background,
  border: colors.border,
  card: colors.surface,
  text: colors.text,
  textMuted: colors.textMuted,
  white: colors.surface,
  danger: colors.danger,
  safe: colors.success,
  warning: colors.warning,
};

export function TechniqueEvaluatorScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const analyzeMutation = useAnalyzeTechniqueMutation();

  const onDrop = (acceptedFiles: File[]) => {
    const firstFile = acceptedFiles[0];
    if (firstFile) {
      setDropError(null);
      setFile(firstFile);
      setFileUrl(URL.createObjectURL(firstFile));
      analyzeMutation.reset();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const tooLarge = rejections.some((item) => item.errors.some((error) => error.code === 'file-too-large'));
      setDropError(tooLarge ? t('app.evaluator.fileTooLarge') : t('app.evaluator.fileType'));
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
    },
    maxFiles: 1,
    maxSize: EVALUATOR_MAX_BYTES,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setDropError(null);
    setIsUploading(true);
    try {
      await analyzeMutation.mutateAsync({ file });
    } catch {
      // El fallo queda en analyzeMutation.isError y se muestra con reintento.
    } finally {
      setIsUploading(false);
    }
  };

  const resetEvaluator = () => {
    setDropError(null);
    setFile(null);
    setFileUrl(null);
    setIsUploading(false);
    analyzeMutation.reset();
  };

  if (analyzeMutation.isSuccess && analyzeMutation.data && fileUrl) {
    const fileIsVideo = file ? file.type.startsWith('video/') : false;
    return (
      <ResultsView result={analyzeMutation.data} onReset={resetEvaluator} fileUrl={fileUrl} isVideo={fileIsVideo} t={t} />
    );
  }

  if (analyzeMutation.isPending || isUploading) {
    return <EntertainingLoader />;
  }

  if (analyzeMutation.isError) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <AsyncStatus
            emptyTitle={t('app.evaluator.error.title')}
            kind={resolveFailureKind(analyzeMutation.error)}
            messageOverride={t('app.evaluator.error.message')}
            onRetry={() => void handleAnalyze()}
            titleOverride={t('app.evaluator.error.title')}
          />
          <Button
            label={t('app.evaluator.resetAction')}
            onPress={resetEvaluator}
            style={styles.errorResetButton}
            variant="secondary"
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>{t('app.evaluator.title')}</Text>
          <Text style={styles.subtitle}>{t('app.evaluator.subtitle')}</Text>
        </View>

        <View style={styles.formCard}>
          <div {...getRootProps()} style={Object.assign({}, stylesHtml.dropzone, isDragActive && stylesHtml.dropzoneActive)}>
            <input {...getInputProps()} />
            {fileUrl && file ? (
              file.type.startsWith('video/') ? (
                <video src={fileUrl} style={stylesHtml.previewMedia} controls muted />
              ) : (
                <img src={fileUrl} style={stylesHtml.previewMedia} alt="Preview" />
              )
            ) : (
              <View style={styles.dropZoneContent}>
                <Text style={styles.dropZoneIcon}>{'\u2601\uFE0F'}</Text>
                <Text style={styles.dropZoneTitle}>{t('app.evaluator.dropHere')}</Text>
                <Text style={styles.dropZoneHint}>{t('app.evaluator.dropHint')}</Text>
              </View>
            )}
          </div>

          {dropError ? <Text style={styles.failureText}>{dropError}</Text> : null}
          <View style={styles.actionsBox}>
            <Button
              disabled={!file}
              label={t('app.evaluator.analyzeAction')}
              onPress={() => void handleAnalyze()}
              style={styles.analyzeButton}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function EntertainingLoader() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGE_KEYS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.action} />
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
          style={stylesHtml.motionWrapper}
        >
          <Text style={styles.loaderText}>{t(LOADING_MESSAGE_KEYS[index] ?? '')}</Text>
        </motion.div>
      </AnimatePresence>
      <Text style={styles.loaderSubtext}>{t('app.evaluator.waitSubtext')}</Text>
    </View>
  );
}

function ResultsView({
  result,
  onReset,
  fileUrl,
  isVideo,
  t,
}: {
  fileUrl: string;
  isVideo: boolean;
  onReset: () => void;
  result: TechniqueAnalysisResult;
  t: TFunction;
}) {
  const isDanger = result.score_seguridad < 50;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.resultHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{result.ejercicio}</Text>
              <Text style={styles.subtitle}>{result.fase_movimiento}</Text>
            </View>
            <Button label={t('app.evaluator.resetAction')} onPress={onReset} size="sm" variant="secondary" />
          </View>
          <View style={[styles.scoreBadge, isDanger ? styles.scoreBadgeDanger : styles.scoreBadgeSafe]}>
            <Text style={[styles.scoreBadgeText, isDanger ? styles.scoreBadgeTextDanger : styles.scoreBadgeTextSafe]}>
              {t('app.evaluator.scoreLabel')} {result.score_seguridad}/100
            </Text>
          </View>
          <Text style={styles.reviewHint}>{t('app.evaluator.reviewHint')}</Text>
        </View>

        <View style={[styles.resultCard, isDanger && styles.resultCardDanger]}>
          <View style={styles.mediaRow}>
            {isVideo ? (
              <video src={fileUrl} style={stylesHtml.resultMedia} controls muted />
            ) : (
              <img src={fileUrl} style={stylesHtml.resultMedia} alt="Preview" />
            )}
            <View style={styles.correctionBanner}>
              <Text style={styles.correctionTitle}>{t('app.evaluator.correctionTitle')}</Text>
              <Text style={styles.correctionText}>{result.correccion_inmediata}</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailList}>
              <Text style={styles.detailTitle}>{t('app.evaluator.errorsTitle')}</Text>
              {result.errores_detectados.map((e: string, i: number) => (
                <Text key={i} style={styles.detailItem}>
                  • {e}
                </Text>
              ))}
            </View>
            <View style={styles.detailList}>
              <Text style={styles.detailTitle}>{t('app.evaluator.pointsTitle')}</Text>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>{t('app.evaluator.backLabel')} </Text>
                <Text style={styles.pointValue}>{result.analisis_puntos_clave.espalda}</Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>{t('app.evaluator.rangeLabel')} </Text>
                <Text style={styles.pointValue}>{result.analisis_puntos_clave.rango_movimiento}</Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>{t('app.evaluator.jointsLabel')} </Text>
                <Text style={styles.pointValue}>{result.analisis_puntos_clave.alineacion_articulaciones}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const stylesHtml = {
  dropzone: {
    border: `2px dashed ${COLORS.border}`,
    borderRadius: '16px',
    backgroundColor: colors.surfaceMuted,
    padding: '40px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all .2s ease-in-out',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '260px',
  },
  dropzoneActive: {
    borderColor: COLORS.action,
    backgroundColor: colors.primarySoft,
  },
  previewMedia: {
    maxHeight: '240px',
    maxWidth: '100%',
    borderRadius: '8px',
    objectFit: 'contain' as const,
  },
  resultMedia: {
    width: '300px',
    height: '240px',
    borderRadius: '12px',
    objectFit: 'cover' as const,
    backgroundColor: colors.text,
  },
  motionWrapper: {
    marginTop: space.xl,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const styles = StyleSheet.create({
  page: {
    alignItems: 'stretch',
    backgroundColor: COLORS.bg,
    flexGrow: 1,
    padding: space.xl,
  },
  container: {
    gap: space.md,
    width: '100%',
  },
  hero: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space.sm,
    padding: space.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  reviewHint: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.sm,
  },
  failureText: {
    color: COLORS.danger,
    fontSize: fontSize.sm,
    marginTop: space.lg,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    width: '100%',
  },
  dropZoneContent: {
    alignItems: 'center',
    gap: space.sm,
  },
  dropZoneIcon: {
    fontSize: 48,
    marginBottom: space.sm,
  },
  dropZoneTitle: {
    color: COLORS.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  dropZoneHint: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
  },
  actionsBox: {
    alignItems: 'center',
    marginTop: space.xl,
  },
  analyzeButton: {
    minWidth: 200,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loaderText: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  loaderSubtext: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.lg,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignSelf: 'flex-start',
    marginTop: space.xs,
  },
  scoreBadgeSafe: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  scoreBadgeDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  scoreBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  scoreBadgeTextSafe: {
    color: colors.success,
  },
  scoreBadgeTextDanger: {
    color: colors.danger,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    padding: space.xl,
    borderColor: COLORS.border,
    borderWidth: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    gap: space.xl,
  },
  resultCardDanger: {
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  errorResetButton: {
    alignSelf: 'center',
  },
  mediaRow: {
    flexDirection: 'row',
    gap: space.xl,
    flexWrap: 'wrap',
  },
  correctionBanner: {
    flex: 1,
    minWidth: 300,
    backgroundColor: colors.warningSoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: space.xl,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  correctionTitle: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginBottom: space.sm,
  },
  correctionText: {
    color: colors.warning,
    fontSize: fontSize.lg,
    fontWeight: '500',
    lineHeight: 26,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xl,
    marginTop: space.md,
    backgroundColor: colors.surfaceMuted,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.background,
  },
  detailList: {
    flex: 1,
    minWidth: 250,
    gap: space.md,
  },
  detailTitle: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: fontSize.sm,
    marginBottom: space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  pointRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pointLabel: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: fontSize.sm,
  },
  pointValue: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    flex: 1,
  },
});
