import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  subtitle?: string;
  title: string;
};

const COLORS = {
  bg: '#f5f8ff',
  border: '#cad8f7',
  subtitle: '#4d6287',
  title: '#163a74',
};

export function Banner(props: Props): React.JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{props.title}</Text>
      {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subtitle: {
    color: COLORS.subtitle,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    color: COLORS.title,
    fontSize: 13,
    fontWeight: '800',
  },
});
