import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LIGHT } from '../../theme/light';
import { s } from './client-shell.styles';

export function AvatarImage(props: { avatarUrl: null | string; size: number }): React.JSX.Element {
  if (props.avatarUrl) {
    return (
      <Image source={{ uri: props.avatarUrl }} style={{ borderRadius: props.size, height: props.size, width: props.size }} />
    );
  }
  return (
    <View style={[s.avatarPlaceholder, { borderRadius: props.size, height: props.size, width: props.size }]}>
      <Text style={{ color: LIGHT.accent, fontSize: props.size * 0.4 }}>{'👤'}</Text>
    </View>
  );
}

export function OverlayBackHeader(props: { onClose: () => void; title?: string }): React.JSX.Element {
  return (
    <View style={s.overlayHeader}>
      <Pressable onPress={props.onClose} style={s.backBtn}>
        <Text style={s.backIcon}>{'←'}</Text>
      </Pressable>
      {props.title ? <Text style={s.overlayTitle}>{props.title}</Text> : null}
    </View>
  );
}
