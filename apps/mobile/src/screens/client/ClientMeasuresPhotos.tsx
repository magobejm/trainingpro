import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientProgressPhoto } from '../../data/hooks/useClientMeQuery';
import { LIGHT } from '../../theme/light';

type Props = { photos: ClientProgressPhoto[] };

export function MeasuresPhotos({ photos }: Props): React.JSX.Element {
  const { t } = useTranslation();

  if (photos.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('client.measures.photos.title')}</Text>
        <Text style={styles.empty}>{t('client.measures.photos.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('client.measures.photos.title')}</Text>
      <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
        {photos.map((photo) => (
          <Image key={photo.id} source={{ uri: photo.imageUrl }} style={styles.thumb} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: LIGHT.textMuted, fontSize: 13, marginTop: 8 },
  row: { gap: 10, paddingVertical: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  thumb: { borderColor: LIGHT.border, borderRadius: LIGHT.radiusMd, borderWidth: 1, height: 120, width: 90 },
});
