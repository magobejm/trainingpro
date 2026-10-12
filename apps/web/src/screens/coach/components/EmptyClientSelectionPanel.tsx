import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  t: (key: string) => string;
};

export function EmptyClientSelectionPanel(props: Props): React.JSX.Element {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIconShell}>
        <View style={styles.emptyIconCore} />
      </View>
      <Text style={styles.emptyTitle}>{props.t('coach.clientProfile.selectTitle')}</Text>
      <Text style={styles.emptyDescription}>{props.t('coach.clientProfile.selectHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 21,
    maxWidth: 480,
    textAlign: 'center',
  },
  emptyIconCore: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 14,
    width: 14,
  },
  emptyIconShell: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  emptyPanel: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: space.md,
    justifyContent: 'center',
    minHeight: 220,
    padding: space.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
});
