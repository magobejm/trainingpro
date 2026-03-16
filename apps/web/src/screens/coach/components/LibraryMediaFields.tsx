import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  DimensionValue,
} from 'react-native';
import { resolvePlaceholder } from './LibraryMediaViewer';

type Props = {
  imageUrl: string;
  isUploading: boolean;
  onUpload: () => void;
  onRemoveImage?: () => void;
  setYoutubeUrl?: (value: string) => void;
  t: (key: string) => string;
  youtubeUrl?: string;
  category?: 'strength' | 'cardio' | 'isometric' | 'plio' | 'warmup' | 'sport';
};

const IMAGE_BLUR_RADIUS = 16;

export function LibraryMediaFields(props: Props): React.JSX.Element {
  const displayImage = props.imageUrl || resolvePlaceholder(props.category);

  return (
    <View style={styles.wrap}>
      <PreviewArea
        displayImage={displayImage}
        imageUrl={props.imageUrl}
        onRemoveImage={props.onRemoveImage}
      />

      <View style={styles.actionsRow}>
        <Pressable onPress={props.onUpload} style={styles.uploadButton}>
          <Text style={styles.uploadButtonLabel}>
            {props.isUploading
              ? props.t('coach.library.media.uploading')
              : props.t('coach.library.media.uploadImage')}
          </Text>
        </Pressable>
      </View>

      {props.setYoutubeUrl && (
        <YouTubeInput
          setYoutubeUrl={props.setYoutubeUrl}
          t={props.t}
          youtubeUrl={props.youtubeUrl}
        />
      )}
    </View>
  );
}

function PreviewArea({
  displayImage,
  imageUrl,
  onRemoveImage,
}: {
  displayImage: string;
  imageUrl: string;
  onRemoveImage?: () => void;
}) {
  // eslint-disable-next-line no-restricted-syntax
  const removeIcon = '✕';
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
        <Pressable onPress={onRemoveImage} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>{removeIcon}</Text>
        </Pressable>
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
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{t('coach.library.media.youtubePlaceholder')}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={setYoutubeUrl}
        placeholder={placeholder}
        style={styles.input}
        value={youtubeUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
    width: '100%' as DimensionValue,
  },
  previewContainer: {
    width: '100%' as DimensionValue,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
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
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  uploadButtonLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
});
