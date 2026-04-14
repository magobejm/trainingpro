import React from 'react';
import { Image, Pressable, Text, View, type ViewStyle } from 'react-native';
import { s } from './client-shell.styles';
import { WEB_BLUR_SM } from './client-shell.constants';

export function AvatarImage(props: { avatarUrl: null | string; size: number }): React.JSX.Element {
  if (props.avatarUrl) {
    return (
      <Image source={{ uri: props.avatarUrl }} style={{ borderRadius: props.size, height: props.size, width: props.size }} />
    );
  }
  return (
    <View style={[s.avatarPlaceholder, { borderRadius: props.size, height: props.size, width: props.size }]}>
      <Text style={{ color: '#fff', fontSize: props.size * 0.4 }}>{'👤'}</Text>
    </View>
  );
}

export function FloatingCircle(props: {
  emoji: string;
  label: string;
  onPress?: () => void;
  position: ViewStyle;
}): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[s.circle, WEB_BLUR_SM, props.position]}>
      <Text style={s.circleEmoji}>{props.emoji}</Text>
      <Text style={s.circleLabel}>{props.label}</Text>
    </Pressable>
  );
}

export function OverlayBackHeader(props: { onClose: () => void; title?: string }): React.JSX.Element {
  return (
    <View style={[s.overlayHeader, WEB_BLUR_SM]}>
      <Pressable onPress={props.onClose} style={s.backBtn}>
        <Text style={s.backIcon}>{'←'}</Text>
      </Pressable>
      {props.title ? <Text style={s.overlayTitle}>{props.title}</Text> : null}
    </View>
  );
}
