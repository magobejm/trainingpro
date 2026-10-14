/* eslint-disable max-lines, max-lines-per-function, no-restricted-syntax, max-len */
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

import { AsyncStatus } from '../../components/AsyncStatus';
import { LOADING_MESSAGE_KEYS, resolveFailureKind } from './technique-evaluator.logic';
import { useAnalyzeTechniqueMutation, type TechniqueAnalysisResult } from '../../data/hooks/ai/useAnalyzeTechniqueMutation';
import type { TFunction } from 'i18next';
import { Button, SkeletonList } from '@trainerpro/ui';

const EVALUATOR_MAX_BYTES = 20 * 1024 * 1024;

import { styles, stylesHtml } from './TechniqueEvaluatorScreen.styles';

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
      <SkeletonList variant="panel" />
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
