import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientMeQuery } from '../../data/hooks/useClientMeQuery';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { filterActivePhotos, hasAnyMeasure } from './client-measures.helpers';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';
import { MeasuresGrid } from './ClientMeasuresGrid';
import { ClientMeasuresForm } from './ClientMeasuresForm';
import { ClientMeasuresHistory } from './ClientMeasuresHistory';
import { MeasuresPhotos } from './ClientMeasuresPhotos';
import { loadProgressCapture } from './load-progress-capture';

type Props = { onClose: () => void };
type CaptureScreen = React.ComponentType<Props>;
const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;

export function ClientMeasuresScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientMeQuery();
  const [capture, setCapture] = useState(false);
  const [form, setForm] = useState(false);
  const [Capture, setCaptureScreen] = useState<CaptureScreen | null>(null);
  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.measures.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('client.measures.subtitle')}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => void openCapture(setCapture, setCaptureScreen)} style={styles.action}>
            <Text style={styles.actionText}>{t('client.measures.addPhotos')}</Text>
          </Pressable>
          <Pressable onPress={() => setForm(true)} style={styles.actionSecondary}>
            <Text style={styles.actionSecondaryText}>{t('client.measures.record')}</Text>
          </Pressable>
        </View>
        <MeasuresBody query={query} t={t} />
        <ClientMeasuresHistory />
      </ScrollView>
      {capture && Capture ? <Capture onClose={() => setCapture(false)} /> : null}
      {form ? <ClientMeasuresForm onClose={() => setForm(false)} /> : null}
    </View>
  );
}

async function openCapture(
  setOpen: (open: boolean) => void,
  setScreen: React.Dispatch<React.SetStateAction<CaptureScreen | null>>,
): Promise<void> {
  const module = await loadProgressCapture();
  setScreen(() => module.ProgressPhotoCapture);
  setOpen(true);
}

function MeasuresBody(props: { query: ReturnType<typeof useClientMeQuery>; t: (key: string) => string }): React.JSX.Element {
  if (props.query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
      </View>
    );
  }
  if (props.query.isError || !props.query.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{props.t('client.measures.error')}</Text>
      </View>
    );
  }
  const photos = filterActivePhotos(props.query.data.progressPhotos ?? []);
  const empty = !hasAnyMeasure(props.query.data) && photos.length === 0;
  return (
    <>
      {empty ? <Text style={styles.empty}>{props.t('client.measures.empty')}</Text> : null}
      <MeasuresGrid client={props.query.data} />
      <MeasuresPhotos photos={photos} />
    </>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusFull,
    flex: 1,
    paddingVertical: 12,
  },
  actionSecondary: {
    alignItems: 'center',
    borderColor: LIGHT.accent,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  actionSecondaryText: { color: LIGHT.accentDark, fontWeight: '700' },
  actionText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16, paddingHorizontal: 16 },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120, padding: 24 },
  container: SCREEN.root,
  content: { paddingBottom: 32 },
  empty: { color: LIGHT.textMuted, fontSize: 14, paddingHorizontal: 16, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 14, textAlign: 'center' },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, paddingHorizontal: 16 },
});
