import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface BlockNotesProps {
  onOpenModal: () => void;
  t: (k: string) => string;
}

export function BlockNotes({ onOpenModal, t }: BlockNotesProps) {
  return (
    <Pressable onPress={onOpenModal} style={styles.link}>
      <Text style={styles.text}>{t('coach.routine.block.notes')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { alignItems: 'center', paddingTop: 4 },
  text: { fontSize: 11, color: '#3b82f6', fontWeight: '500' },
});
