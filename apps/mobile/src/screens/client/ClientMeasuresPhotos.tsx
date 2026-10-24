import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientProgressPhoto } from '../../data/hooks/useClientMeQuery';
import { LIGHT } from '../../theme/light';
import { groupPhotosByPose, PROGRESS_POSES, type ProgressPose } from './client-measures.helpers';

type Props = { photos: ClientProgressPhoto[] };
const GROUPS: Array<ProgressPose | 'other'> = [...PROGRESS_POSES, 'other'];

export function MeasuresPhotos(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const groups = groupPhotosByPose(props.photos);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('client.measures.photos.title')}</Text>
      {props.photos.length === 0 ? <Text style={styles.empty}>{t('client.measures.photos.empty')}</Text> : null}
      {GROUPS.map((pose) => (
        <PhotoGroup key={pose} photos={groups[pose]} title={t(`client.measures.photos.pose.${pose}`)} />
      ))}
    </View>
  );
}

function PhotoGroup(props: { photos: ClientProgressPhoto[]; title: string }): React.JSX.Element | null {
  if (props.photos.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.pose}>{props.title}</Text>
      <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
        {props.photos.map((photo) => (
          <View key={photo.id} style={styles.thumbWrap}>
            <Image source={{ uri: photo.imageUrl }} style={styles.thumb} />
            <Text style={styles.date}>{formatWhen(photo.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  date: { color: LIGHT.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  empty: { color: LIGHT.textMuted, fontSize: 13, marginTop: 8 },
  group: { marginTop: 12 },
  pose: { color: LIGHT.text, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  row: { gap: 10 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  thumb: { borderColor: LIGHT.border, borderRadius: LIGHT.radiusMd, borderWidth: 1, height: 120, width: 90 },
  thumbWrap: { width: 90 },
});
