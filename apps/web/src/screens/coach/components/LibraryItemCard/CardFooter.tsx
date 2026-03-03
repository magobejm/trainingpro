import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';

const ICON_EDIT = '✏️';
const ICON_DELETE = '🗑️';

interface CardFooterProps {
  onEdit?: () => void;
  onDelete?: () => void;
  coachOwned: boolean;
}

export function CardFooter({ onEdit, onDelete, coachOwned }: CardFooterProps) {
  if (!coachOwned) return null;

  return (
    <View style={styles.footer}>
      <View style={styles.adminActions}>
        <Pressable onPress={onEdit} style={styles.iconButton}>
          {/* eslint-disable-next-line no-restricted-syntax */}
          <Text style={styles.iconText}>{ICON_EDIT}</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.iconButton, styles.deleteButton]}>
          {/* eslint-disable-next-line no-restricted-syntax */}
          <Text style={styles.iconText}>{ICON_DELETE}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  iconText: {
    fontSize: 14,
  },
});
