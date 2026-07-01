import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientMeQuery } from '../../data/hooks/useClientMeQuery';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { filterActivePhotos, hasAnyMeasure } from './client-measures.helpers';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';
import { MeasuresGrid } from './ClientMeasuresGrid';
import { MeasuresPhotos } from './ClientMeasuresPhotos';

type Props = { onClose: () => void };

const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;

export function ClientMeasuresScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientMeQuery();

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.measures.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('client.measures.subtitle')}</Text>
        {renderBody(query, t)}
      </ScrollView>
    </View>
  );
}

function renderBody(query: ReturnType<typeof useClientMeQuery>, t: (key: string) => string): React.JSX.Element {
  if (query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
      </View>
    );
  }
  if (query.isError || !query.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('client.measures.error')}</Text>
      </View>
    );
  }
  const client = query.data;
  const photos = filterActivePhotos(client.progressPhotos ?? []);
  const empty = !hasAnyMeasure(client) && photos.length === 0;

  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('client.measures.empty')}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.hint}>
        <Text style={styles.hintText}>{t('client.measures.readOnlyHint')}</Text>
      </View>
      <MeasuresGrid client={client} />
      <MeasuresPhotos photos={photos} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 200, padding: 24 },
  container: SCREEN.root,
  content: { paddingBottom: 32 },
  empty: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 14, textAlign: 'center' },
  hint: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
  },
  hintText: { color: LIGHT.accentDark, fontSize: 12, textAlign: 'center' },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, paddingHorizontal: 16 },
});
