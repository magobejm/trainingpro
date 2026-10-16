import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { CoachPage, CoachButton, CoachField, ui } from './CoachUi';
import { CoachPdfButton } from './CoachPdfButton';
import { acceptEvaluatorFile, isTechniqueResult, type CoachTechniqueResult } from './coach-evaluator-model';
export function CoachEvaluatorScreen() {
  return <EvaluatorView {...useEvaluatorModel()} />;
}
function useEvaluatorModel() {
  const { t, i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  const [file, setFile] = useState<DocumentPickerAsset | null>(null);
  const [exercise, setExercise] = useState('');
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const auth = useCoachAuth();
  const toast = useToast();
  const label = (es: string, english: string) => (en ? english : es);
  const analyze = useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async () => {
      if (!file || !auth.accessToken || auth.activeRole !== 'coach') throw new Error(t('coachWorkspace.sessionRequired'));
      const mime = acceptEvaluatorFile(file);
      if (!mime)
        throw new Error(label('Formato o tamaño no válido (máximo 20 MB).', 'Unsupported format or size (maximum 20 MB).'));
      const form = new FormData();
      form.append('file', file.file ?? ({ uri: file.uri, name: file.name, type: mime } as unknown as Blob));
      if (exercise.trim()) form.append('exerciseName', exercise.trim());
      const response = await fetch(
        (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080') + '/ai-evaluator/analyze',
        { method: 'POST', headers: { Authorization: 'Bearer ' + auth.accessToken, 'X-Active-Role': 'coach' }, body: form },
      );
      if (!response.ok)
        throw new Error(
          label(
            'No se ha podido analizar. Puedes reintentar con el mismo archivo.',
            'Analysis failed. You can retry with the same file.',
          ),
        );
      const result: unknown = await response.json();
      if (!isTechniqueResult(result))
        throw new Error(
          label(
            'El análisis ha devuelto un resultado incompleto. Reintenta.',
            'Analysis returned an incomplete result. Retry.',
          ),
        );
      return result;
    },
    onSuccess: () => toast.success(t('coachWorkspace.saved')),
    onError: (failure: Error) => setError(failure.message),
  });
  const choose = async () => {
    if (picking || analyze.isPending) return;
    setPicking(true);
    try {
      const picker = await import('expo-document-picker');
      const result = await picker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm'],
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset || !acceptEvaluatorFile(asset))
        throw new Error(
          label('Elige JPG, PNG, MP4, MOV o WEBM de hasta 20 MB.', 'Choose JPG, PNG, MP4, MOV or WEBM up to 20 MB.'),
        );
      setFile(asset);
      setError('');
      analyze.reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('coachWorkspace.uploadError'));
    } finally {
      setPicking(false);
    }
  };
  return { t, label, analyze, choose, file, exercise, setExercise, error, setError, picking };
}
function EvaluatorView({
  t,
  label,
  analyze,
  choose,
  file,
  exercise,
  setExercise,
  error,
  setError,
  picking,
}: ReturnType<typeof useEvaluatorModel>) {
  return (
    <CoachPage title={label('Evaluador técnico', 'Technique evaluator')}>
      <Text style={ui.muted}>
        {label(
          'Imagen o vídeo · JPG, PNG, MP4, MOV, WEBM · máximo 20 MB',
          'Image or video · JPG, PNG, MP4, MOV, WEBM · maximum 20 MB',
        )}
      </Text>
      <CoachButton
        label={label('Seleccionar archivo', 'Select file')}
        onPress={() => void choose()}
        loading={picking}
        disabled={analyze.isPending}
      />
      {file ? (
        <>
          <Text style={ui.label}>{file.name}</Text>
          {(acceptEvaluatorFile(file) ?? '').startsWith('video/') ? (
            <EvaluatorVideo uri={file.uri} />
          ) : (
            <Image accessibilityLabel={file.name} source={{ uri: file.uri }} style={mediaStyle} />
          )}
        </>
      ) : null}
      <CoachField label={label('Ejercicio (opcional)', 'Exercise (optional)')} value={exercise} onChange={setExercise} />
      {error ? (
        <Text accessibilityRole={'alert'} style={ui.error}>
          {error}
        </Text>
      ) : null}
      <CoachButton
        label={analyze.isError ? t('coachWorkspace.retry') : label('Analizar', 'Analyze')}
        disabled={!file || picking}
        loading={analyze.isPending}
        onPress={() => {
          setError('');
          analyze.mutate();
        }}
      />
      {analyze.data ? <EvaluatorResult result={analyze.data} /> : null}
    </CoachPage>
  );
}
function EvaluatorVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
    instance.loop = false;
  });
  return <VideoView player={player} nativeControls style={mediaStyle} />;
}
function EvaluatorResult({ result }: { result: CoachTechniqueResult }) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  const sections = [
    { title: en ? 'Immediate correction' : 'Corrección inmediata', lines: [result.correccion_inmediata] },
    { title: en ? 'Detected errors' : 'Errores detectados', lines: result.errores_detectados },
    {
      title: en ? 'Key points' : 'Puntos clave',
      lines: [
        (en ? 'Back: ' : 'Espalda: ') + result.analisis_puntos_clave.espalda,
        (en ? 'Range of motion: ' : 'Rango de movimiento: ') + result.analisis_puntos_clave.rango_movimiento,
        (en ? 'Joint alignment: ' : 'Alineación articular: ') + result.analisis_puntos_clave.alineacion_articulaciones,
      ],
    },
  ];
  return (
    <View style={ui.field}>
      <Text style={ui.title}>{result.ejercicio}</Text>
      <Text style={ui.text}>{result.fase_movimiento}</Text>
      <Text style={result.score_seguridad < 50 ? ui.error : ui.label}>
        {(en ? 'Safety score: ' : 'Puntuación de seguridad: ') + result.score_seguridad + '/100'}
      </Text>
      {sections.map((section) => (
        <View key={section.title} style={ui.card}>
          <Text style={ui.label}>{section.title}</Text>
          {section.lines.map((line, index) => (
            <Text key={index} style={ui.text}>
              {line}
            </Text>
          ))}
        </View>
      ))}
      <CoachPdfButton title={result.ejercicio} sections={sections} />
    </View>
  );
}
const mediaStyle = StyleSheet.create({ media: { width: '100%', height: 240, borderRadius: 16 } }).media;
