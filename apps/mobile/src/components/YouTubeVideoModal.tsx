import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { buildYouTubePlayerUrl } from '../utils/library-media.helpers';
import { LIGHT } from '../theme/light';

type YouTubeVideoModalProps = {
  title?: string;
  visible: boolean;
  youtubeUrl: null | string;
  onClose: () => void;
};

export function YouTubeVideoModal({
  title,
  visible,
  youtubeUrl,
  onClose,
}: YouTubeVideoModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [playerReady, setPlayerReady] = useState(false);
  const playerUrl = youtubeUrl ? buildYouTubePlayerUrl(youtubeUrl) : null;

  useEffect(() => {
    if (!visible) {
      setPlayerReady(false);
    }
  }, [visible]);

  if (!playerUrl) {
    return null;
  }

  return (
    <Modal animationType={'fade'} onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            {title ? (
              <Text numberOfLines={2} style={styles.title}>
                {title}
              </Text>
            ) : (
              <View style={styles.titleSpacer} />
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>{'✕'}</Text>
            </Pressable>
          </View>
          <View style={styles.playerWrap}>
            {visible && playerReady ? (
              <YouTubePlayer playerUrl={playerUrl} />
            ) : (
              <Pressable onPress={() => setPlayerReady(true)} style={styles.playPrompt}>
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>{'▶'}</Text>
                </View>
                <Text style={styles.playLabel}>{t('client.library.detail.viewVideo')}</Text>
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.footerBtn}>
            <Text style={styles.footerBtnText}>{t('client.wizard.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function YouTubePlayer({ playerUrl }: { playerUrl: string }): React.JSX.Element {
  if (Platform.OS === 'web') {
    const Iframe = 'iframe' as unknown as React.ElementType;
    return (
      <Iframe
        allow={'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'}
        allowFullScreen
        src={playerUrl}
        style={IFRAME_STYLE}
        title={'youtube-player'}
      />
    );
  }

  return (
    <WebView
      allowsFullscreenVideo
      javaScriptEnabled
      mediaPlaybackRequiresUserAction={false}
      source={{ uri: playerUrl }}
      style={styles.webview}
    />
  );
}

const IFRAME_STYLE: React.CSSProperties = {
  border: '0px',
  height: '100%',
  width: '100%',
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    maxWidth: 640,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  titleSpacer: {
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: LIGHT.textMuted,
    fontSize: 20,
  },
  playerWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    width: '100%',
  },
  webview: {
    flex: 1,
  },
  playPrompt: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 40,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  playIcon: {
    color: '#fff',
    fontSize: 28,
    marginLeft: 4,
  },
  playLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  footerBtn: {
    alignItems: 'center',
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    paddingVertical: 14,
  },
  footerBtnText: {
    color: LIGHT.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
