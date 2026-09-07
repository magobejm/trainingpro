import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const IMAGE_BLUR_RADIUS = 16;

type BlurredImageFrameProps = {
  imageUri: string;
  style?: StyleProp<ViewStyle>;
};

export function BlurredImageFrame({ imageUri, style }: BlurredImageFrameProps): React.JSX.Element {
  const source = { uri: imageUri };

  return (
    <View style={[styles.frame, style]}>
      <Image blurRadius={IMAGE_BLUR_RADIUS} resizeMode={'cover'} source={source} style={styles.backdrop} />
      <View style={styles.shade} />
      <Image resizeMode={'contain'} source={source} style={styles.foreground} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 20, 0.2)',
  },
  foreground: {
    height: '100%',
    width: '100%',
  },
});
