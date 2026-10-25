import React from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export function VideoAttachment(props: { uri: string }): React.JSX.Element {
  const player = useVideoPlayer(props.uri, (instance) => {
    instance.loop = false;
  });
  return <VideoView accessibilityLabel={'video'} nativeControls player={player} style={styles.video} />;
}

const styles = StyleSheet.create({
  video: { borderRadius: 12, height: 180, marginTop: 6, width: 240 },
});
