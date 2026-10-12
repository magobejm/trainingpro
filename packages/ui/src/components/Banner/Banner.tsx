import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type Props = {
  subtitle?: string;
  title: string;
};

const COLORS = {
  bg: colors.primarySoft,
  border: colors.primaryBorder,
  subtitle: colors.textMuted,
  title: colors.text,
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
