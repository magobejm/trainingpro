import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export type ClientCardItem = {
  id: string;
  subtitle: string;
  title: string;
};

type Props = {
  actionLabel: string;
  items: ClientCardItem[];
  onActionPress: (clientId: string) => void;
  onItemPress: (clientId: string) => void;
};

const COLORS = {
  action: colors.primary,
  border: colors.border,
  card: colors.surface,
  subtitle: colors.textMuted,
  text: colors.text,
  white: colors.onPrimary,
};

export function ClientCardRow(props: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      {props.items.map((item) => (
        <Pressable key={item.id} onPress={() => props.onItemPress(item.id)} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Pressable onPress={() => props.onActionPress(item.id)} style={styles.actionButton}>
            <Text style={styles.actionLabel}>{props.actionLabel}</Text>
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 36,
  },
  actionLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 220,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  subtitle: {
    color: COLORS.subtitle,
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
