import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, EmptyState, radius, space } from '@trainerpro/ui';

type Props = {
  t: (key: string) => string;
};

export function EmptyClientSelectionPanel(props: Props): React.JSX.Element {
  return (
    <View style={styles.emptyPanel}>
      <EmptyState message={props.t('coach.clientProfile.selectHint')} title={props.t('coach.clientProfile.selectTitle')} />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyPanel: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 220,
    padding: space.lg,
  },
});
