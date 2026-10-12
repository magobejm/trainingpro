import React from 'react';
import { Image, StyleSheet, Text, type TextInputProps, View, DimensionValue } from 'react-native';
import { resolvePlaceholder } from './LibraryMediaViewer';
import { Button, IconButton, TextField, colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  imageUrl: string;
  isUploading: boolean;
  onUpload: () => void;
  onRemoveImage?: () => void;
  setYoutubeUrl?: (value: string) => void;
  t: (key: string) => string;
  youtubeUrl?: string;
  category?: 'strength' | 'cardio' | 'isometric' | 'plio' | 'mobility' | 'sport';
};

const IMAGE_BLUR_RADIUS = 16;
const REMOVE_GLYPH = '✕';
const noop = (): void => undefined;

export function LibraryMediaFields(props: Props): React.JSX.Element {
  const displayImage = props.imageUrl || resolvePlaceholder(props.category);

  return (
    <View style={styles.wrap}>
      <PreviewArea
        displayImage={displayImage}
        imageUrl={props.imageUrl}
        onRemoveImage={props.onRemoveImage}
        removeLabel={props.t('coach.library.media.removeImage')}
      />

      <View style={styles.actionsRow}>
        <Button
          label={props.isUploading ? props.t('coach.library.media.uploading') : props.t('coach.library.media.uploadImage')}
          loading={props.isUploading}
          onPress={props.onUpload}
          style={styles.uploadButton}
          variant="secondary"
        />
      </View>

      {props.setYoutubeUrl && <YouTubeInput setYoutubeUrl={props.setYoutubeUrl} t={props.t} youtubeUrl={props.youtubeUrl} />}
    </View>
  );
}

function PreviewArea({
  displayImage,
  imageUrl,
  onRemoveImage,
  removeLabel,
}: {
  displayImage: string;
  imageUrl: string;
  onRemoveImage?: () => void;
  removeLabel: string;
}) {
  return (
    <View style={styles.previewContainer}>
      <Image
        blurRadius={IMAGE_BLUR_RADIUS}
        // eslint-disable-next-line no-restricted-syntax
        resizeMode="cover"
        source={{ uri: displayImage }}
        style={styles.imageBackdrop}
      />
      <View style={styles.imageShade} />
      {/* eslint-disable-next-line no-restricted-syntax */}
      <Image resizeMode="contain" source={{ uri: displayImage }} style={styles.image} />

      {imageUrl ? (
        <View style={styles.removeBtn}>
          <IconButton
            accessibilityLabel={removeLabel}
            icon={(color) => <Text style={[styles.removeBtnText, { color }]}>{REMOVE_GLYPH}</Text>}
            onPress={onRemoveImage ?? noop}
            size={28}
            tone="danger"
          />
        </View>
      ) : null}
    </View>
  );
}

function YouTubeInput({
  setYoutubeUrl,
  t,
  youtubeUrl,
}: {
  setYoutubeUrl: (v: string) => void;
  t: (k: string) => string;
  youtubeUrl?: string;
}) {
  const autoCapitalize: TextInputProps['autoCapitalize'] = 'none';
  const keyboardType: TextInputProps['keyboardType'] = 'url';
  // eslint-disable-next-line no-restricted-syntax
  const placeholder = 'https://youtube.com/...';

  return (
    <TextField
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      label={t('coach.library.media.youtubePlaceholder')}
      onChangeText={setYoutubeUrl}
      placeholder={placeholder}
      value={youtubeUrl}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xl,
    width: '100%' as DimensionValue,
  },
  previewContainer: {
    width: '100%' as DimensionValue,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInverse,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 20, 0.3)',
  },
  image: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  removeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  uploadButton: {
    flex: 1,
  },
});
