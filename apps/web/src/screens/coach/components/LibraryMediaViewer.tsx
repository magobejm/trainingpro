import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageProps,
  DimensionValue,
} from 'react-native';
import { getYouTubeThumbnailUrl, toYouTubeEmbedUrl } from '../library-media.helpers';
import { readFrontEnv } from '../../../data/env';

type Props = {
  imageUrl: null | string;
  t: (key: string) => string;
  youtubeUrl: null | string;
  fullWidth?: boolean;
  category?: 'strength' | 'cardio' | 'plio' | 'warmup' | 'sport';
};

export function resolvePlaceholder(category?: string): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  const apiBase = url.endsWith('/') ? url.slice(0, -1) : url;

  switch (category) {
    case 'cardio':
      return `${apiBase}/assets/placeholders/cardio-bg.jpg`;
    case 'plio':
      return `${apiBase}/assets/placeholders/plio-placeholder.png`;
    case 'warmup':
      return `${apiBase}/assets/placeholders/warmup-placeholder.png`;
    case 'sport':
      return `${apiBase}/assets/placeholders/sports-placeholder.png`;
    default:
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';
  }
}

export function LibraryMediaViewer(props: Props): React.JSX.Element {
  const hasVideo = Boolean(props.youtubeUrl);
  const placeholder = resolvePlaceholder(props.category);

  return (
    <View style={[styles.wrap, props.fullWidth && styles.wrapFull]}>
      {hasVideo ? (
        <YouTubeBlock fullWidth={props.fullWidth} t={props.t} youtubeUrl={props.youtubeUrl!} />
      ) : (
        <BlurredImageFrame fullWidth={props.fullWidth} imageUrl={props.imageUrl || placeholder} />
      )}
    </View>
  );
}

const IMAGE_RESIZE_MODE: ImageProps['resizeMode'] = 'contain';
const THUMBNAIL_RESIZE_MODE: ImageProps['resizeMode'] = 'cover';
const IMAGE_BLUR_RADIUS = 16;
const PLAY_ICON = '▶';
const IFRAME_LOADING = 'lazy' as const;

function BlurredImageFrame(props: { imageUrl: string; fullWidth?: boolean }): React.JSX.Element {
  const source = { uri: props.imageUrl };
  const frameStyle = props.fullWidth ? styles.imageFrameFull : styles.imageFrame;
  const imgStyle = props.fullWidth ? styles.imageFull : styles.image;
  return (
    <View style={frameStyle}>
      <Image
        blurRadius={IMAGE_BLUR_RADIUS}
        // eslint-disable-next-line no-restricted-syntax
        resizeMode="cover"
        source={source}
        style={styles.imageBackdrop}
      />
      <View style={styles.imageShade} />
      <Image resizeMode={IMAGE_RESIZE_MODE} source={source} style={imgStyle} />
    </View>
  );
}

function YouTubeBlock(props: {
  t: Props['t'];
  youtubeUrl: string;
  fullWidth?: boolean;
}): React.JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const embedUrl = toYouTubeEmbedUrl(props.youtubeUrl);
  const thumbnailUrl = getYouTubeThumbnailUrl(props.youtubeUrl);

  const onPlay = () => setIsLoaded(true);

  return (
    <View style={[styles.videoWrap, props.fullWidth && styles.videoWrapFull]}>
      {props.fullWidth && thumbnailUrl && !isLoaded && (
        <VideoBackdrop thumbnailUrl={thumbnailUrl} />
      )}

      {isLoaded && embedUrl ? (
        <YouTubeFrame embedUrl={embedUrl} fullWidth={props.fullWidth} />
      ) : (
        <YouTubePreview fullWidth={props.fullWidth} onPress={onPlay} thumbnailUrl={thumbnailUrl} />
      )}
      {!props.fullWidth && (
        <Pressable onPress={() => void Linking.openURL(props.youtubeUrl)}>
          <Text style={styles.videoLink}>{props.t('coach.library.media.openYoutube')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function VideoBackdrop({ thumbnailUrl }: { thumbnailUrl: string }) {
  return (
    <>
      <Image
        blurRadius={IMAGE_BLUR_RADIUS}
        // eslint-disable-next-line no-restricted-syntax
        resizeMode="cover"
        source={{ uri: thumbnailUrl }}
        style={styles.imageBackdrop}
      />
      <View style={styles.imageShade} />
    </>
  );
}

function YouTubePreview(props: {
  onPress: () => void;
  thumbnailUrl: null | string;
  fullWidth?: boolean;
}): React.JSX.Element {
  const previewStyle = props.fullWidth ? styles.videoPreviewFull : styles.videoPreview;
  const thumbStyle = props.fullWidth ? styles.thumbnailFull : styles.thumbnail;
  return (
    <Pressable onPress={props.onPress} style={previewStyle}>
      {props.thumbnailUrl ? (
        <Image
          resizeMode={THUMBNAIL_RESIZE_MODE}
          source={{ uri: props.thumbnailUrl }}
          style={thumbStyle}
        />
      ) : (
        <View style={[thumbStyle, { backgroundColor: '#000' }]} />
      )}
      <View style={styles.playOverlay}>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>{PLAY_ICON}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function YouTubeFrame(props: { embedUrl: string; fullWidth?: boolean }): React.JSX.Element {
  const Iframe = 'iframe' as unknown as React.ElementType;
  const iframeAllow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  const iframeTitle = 'youtube-player';
  const style = props.fullWidth ? IFRAME_STYLE_FULL : IFRAME_STYLE;
  return (
    <Iframe
      allow={iframeAllow}
      allowFullScreen
      loading={IFRAME_LOADING}
      src={`${props.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
      style={style}
      title={iframeTitle}
    />
  );
}

const IFRAME_STYLE: React.CSSProperties = {
  border: '0px',
  borderRadius: '8px',
  height: 140,
  width: 220,
};

const IFRAME_STYLE_FULL: React.CSSProperties = {
  border: '0px',
  borderRadius: '0px',
  height: '100%',
  width: '100%',
};

const styles = StyleSheet.create({
  empty: {
    color: '#1a2536',
    fontSize: 12,
  },
  image: {
    borderRadius: 8,
    height: 140,
    width: 220,
  },
  imageFull: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
  },
  imageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFrame: {
    borderRadius: 8,
    height: 140,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 220,
  },
  imageFrameFull: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 20, 0.2)',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  playIcon: {
    color: '#fff',
    fontSize: 32,
    marginLeft: 4, // Center adjustment for play icon
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    borderRadius: 8,
    height: 140,
    width: 220,
  },
  thumbnailFull: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
  },
  videoLink: {
    color: '#1c74e9',
    fontSize: 12,
    fontWeight: '700',
  },
  videoPreview: {
    borderRadius: 8,
    height: 140,
    overflow: 'hidden',
    position: 'relative',
    width: 220,
  },
  videoPreviewFull: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
    overflow: 'hidden',
    position: 'relative',
  },
  videoWrap: {
    gap: 6,
  },
  videoWrapFull: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wrapFull: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
    margin: 0,
    padding: 0,
  },
});
