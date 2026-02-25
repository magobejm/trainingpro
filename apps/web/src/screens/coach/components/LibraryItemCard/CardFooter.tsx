import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';

const ICON_EDIT = '✎';
const ICON_DELETE = '✕';

interface CardFooterProps {
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  coachOwned: boolean;
  t: (k: string) => string;
}

export function CardFooter({
  expanded,
  onToggle,
  onEdit,
  onDelete,
  coachOwned,
  t,
}: CardFooterProps) {
  return (
    <View style={styles.footer}>
      <Pressable onPress={onToggle} style={styles.detailsButton}>
        <Text style={styles.detailsButtonText}>
          {expanded
            ? t('coach.library.exercises.actions.hideDetail')
            : t('coach.library.exercises.actions.viewDetail')}
        </Text>
      </Pressable>
      {coachOwned && (
        <View style={styles.adminActions}>
          <Pressable onPress={onEdit} style={styles.iconButton}>
            <Text style={styles.iconText}>{ICON_EDIT}</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.iconButton, styles.deleteButton]}>
            <Text style={styles.iconText}>{ICON_DELETE}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  detailsButton: {
    paddingVertical: 4,
  },
  detailsButtonText: {
    color: '#1c74e9',
    fontSize: 12,
    fontWeight: '700',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  iconText: {
    fontSize: 14,
  },
});
