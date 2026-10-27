import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { formatMeasureDate, type MeasurePhoto } from './client-measures';

type Translate = (key: string, params?: Record<string, number | string>) => string;

/** Progress photos, full figure, newest first. Stacked when the page is narrow. */
export function MeasuresPhotos(props: { narrow: boolean; photos: MeasurePhoto[]; t: Translate }): React.JSX.Element | null {
  if (props.photos.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{props.t('coach.measures.photos')}</Text>
      <View style={[styles.gallery, props.narrow && styles.galleryNarrow]}>
        {props.photos.map((photo) => (
          <PhotoFrame key={photo.id} narrow={props.narrow} photo={photo} />
        ))}
      </View>
    </View>
  );
}

function PhotoFrame(props: { narrow: boolean; photo: MeasurePhoto }): React.JSX.Element {
  return (
    <View style={[styles.item, props.narrow && styles.itemNarrow]}>
      <View style={styles.frame}>
        <Image resizeMode={'contain'} source={{ uri: props.photo.imageUrl }} style={styles.image} />
      </View>
      <Text style={styles.date}>{formatMeasureDate(props.photo.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  date: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  frame: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    overflow: 'hidden',
    width: '100%',
  },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  galleryNarrow: { flexDirection: 'column' },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  image: { height: '100%', width: '100%' },
  item: { gap: space.xs, maxWidth: 220, width: 200 },
  itemNarrow: { alignSelf: 'center', maxWidth: 360, width: '100%' },
  section: { gap: space.sm },
});
