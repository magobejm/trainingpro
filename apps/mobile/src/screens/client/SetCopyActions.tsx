import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TFunction } from 'i18next';
import { LIGHT } from '../../theme/light';

export function SetCopyActions(props: {
  lastEnabled: boolean;
  onCopyLast: () => void;
  onCopyTarget: () => void;
  readOnly?: boolean;
  t: TFunction;
  targetEnabled: boolean;
}): React.JSX.Element | null {
  if (props.readOnly) return null;
  return (
    <View style={styles.row}>
      <CopyChip
        enabled={props.targetEnabled}
        label={props.t('mobile.client.session.copyTarget')}
        onPress={props.onCopyTarget}
      />
      <CopyChip enabled={props.lastEnabled} label={props.t('mobile.client.session.copyLast')} onPress={props.onCopyLast} />
    </View>
  );
}

function CopyChip(props: { enabled: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={props.label}
      accessibilityRole={'button'}
      accessibilityState={{ disabled: !props.enabled }}
      disabled={!props.enabled}
      onPress={props.onPress}
      style={[styles.chip, !props.enabled && styles.chipDisabled]}
    >
      <Text style={[styles.chipText, !props.enabled && styles.chipTextDisabled]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDisabled: { backgroundColor: LIGHT.bgSoft },
  chipText: { color: LIGHT.accentDark, fontSize: 13, fontWeight: '700' },
  chipTextDisabled: { color: LIGHT.textMuted },
});
