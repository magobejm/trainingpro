import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, space } from '@trainerpro/ui';
import { Pencil, Trash2 } from 'lucide-react';

const ICON_SIZE = 16;

const noop = (): void => undefined;

interface CardFooterProps {
  onEdit?: () => void;
  onDelete?: () => void;
  coachOwned: boolean;
  t: (key: string) => string;
}

export function CardFooter({ onEdit, onDelete, coachOwned, t }: CardFooterProps) {
  if (!coachOwned) return null;

  return (
    <View style={styles.footer}>
      <View style={styles.adminActions}>
        <IconButton
          accessibilityLabel={t('coach.library.exercises.actions.edit')}
          icon={(color) => <Pencil color={color} size={ICON_SIZE} />}
          onPress={onEdit ?? noop}
        />
        <IconButton
          accessibilityLabel={t('coach.library.exercises.actions.delete')}
          icon={(color) => <Trash2 color={color} size={ICON_SIZE} />}
          onPress={onDelete ?? noop}
          tone="danger"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: space.sm,
  },
  adminActions: {
    flexDirection: 'row',
    gap: space.md,
  },
});
