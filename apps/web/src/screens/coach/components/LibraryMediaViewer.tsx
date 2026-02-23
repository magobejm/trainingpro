import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View, type ImageProps } from 'react-native';
import { getYouTubeThumbnailUrl, toYouTubeEmbedUrl } from '../library-media.helpers';

type Props = {
  imageUrl: null | string;
  t: (key: string) => string;
  youtubeUrl: null | string;
};

export function LibraryMediaViewer(props: Props): React.JSX.Element {
  const hasImage = Boolean(props.imageUrl);
  const hasVideo = Boolean(props.youtubeUrl);
  if (!hasImage && !hasVideo) {
    return <Text style={styles.empty}>{props.t('coach.library.media.empty')}</Text>;
  }
  return (
    <View style={styles.wrap}>
      {hasImage ? <BlurredImageFrame imageUrl={props.imageUrl!} /> : null}
      {hasVideo ? <YouTubeBlock t={props.t} youtubeUrl={props.youtubeUrl!} /> : null}
    </View>
  );
}

const IMAGE_RESIZE_MODE: ImageProps['resizeMode'] = 'contain';
const IMAGE_BACKDROP_RESIZE_MODE: ImageProps['resizeMode'] = 'cover';
const THUMBNAIL_RESIZE_MODE: ImageProps['resizeMode'] = 'cover';
const IMAGE_BLUR_RADIUS = 16;
const PLAY_ICON = '▶';
const IFRAME_LOADING = 'lazy' as const;

function BlurredImageFrame(props: { imageUrl: string }): React.JSX.Element {
  const source = { uri: props.imageUrl };
  return (
    <View style={styles.imageFrame}>
      <Image
        blurRadius={IMAGE_BLUR_RADIUS}
        resizeMode={IMAGE_BACKDROP_RESIZE_MODE}
        source={source}
        style={styles.imageBackdrop}
      />
      <View style={styles.imageShade} />
      <Image resizeMode={IMAGE_RESIZE_MODE} source={source} style={styles.image} />
    </View>
  );
}

function YouTubeBlock(props: { t: Props['t']; youtubeUrl: string }): React.JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const embedUrl = toYouTubeEmbedUrl(props.youtubeUrl);
  const thumbnailUrl = getYouTubeThumbnailUrl(props.youtubeUrl);

  const onPlay = () => setIsLoaded(true);

  return (
    <View style={styles.videoWrap}>
      {isLoaded && embedUrl ? (
        <YouTubeFrame embedUrl={embedUrl} />
      ) : (
        <YouTubePreview onPress={onPlay} thumbnailUrl={thumbnailUrl} />
      )}
      <Pressable onPress={() => void Linking.openURL(props.youtubeUrl)}>
        <Text style={styles.videoLink}>{props.t('coach.library.media.openYoutube')}</Text>
      </Pressable>
    </View>
  );
}

function YouTubePreview(props: {
  onPress: () => void;
  thumbnailUrl: null | string;
}): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={styles.videoPreview}>
      {props.thumbnailUrl ? (
        <Image
          resizeMode={THUMBNAIL_RESIZE_MODE}
          source={{ uri: props.thumbnailUrl }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, { backgroundColor: '#000' }]} />
      )}
      <View style={styles.playOverlay}>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>{PLAY_ICON}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function YouTubeFrame(props: { embedUrl: string }): React.JSX.Element {
  const Iframe = 'iframe' as unknown as React.ElementType;
  const iframeAllow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  const iframeTitle = 'youtube-player';
  return (
    <Iframe
      allow={iframeAllow}
      allowFullScreen
      loading={IFRAME_LOADING}
      src={`${props.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
      style={IFRAME_STYLE}
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
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 20, 0.2)',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  playIcon: {
    color: '#fff',
    fontSize: 24,
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
  videoWrap: {
    gap: 6,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
