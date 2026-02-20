import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    color: '#6e7785',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 480,
    textAlign: 'center',
  },
  emptyIconCore: {
    backgroundColor: '#dce9ff',
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  emptyIconShell: {
    alignItems: 'center',
    backgroundColor: '#eef4ff',
    borderColor: '#c8d8f8',
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  emptyPanel: {
    alignItems: 'center',
    borderColor: '#d5deea',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 10,
    justifyContent: 'center',
    minHeight: 220,
    padding: 18,
  },
  emptyTitle: {
    color: '#162132',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
});
