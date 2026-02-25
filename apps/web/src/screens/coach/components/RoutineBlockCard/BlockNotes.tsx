import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface BlockNotesProps {
  notes: string | undefined;
  readOnly: boolean;
  onUpdate: (v: string) => void;
  t: (k: string) => string;
}

export function BlockNotes({ notes, readOnly, onUpdate, t }: BlockNotesProps) {
  return (
    <View style={styles.detailsBox}>
      <Text style={s.label}>{t('coach.routine.block.notes')}</Text>
      <TextInput
        editable={!readOnly}
        multiline
        onChangeText={onUpdate}
        placeholder={t('coach.routine.block.notesPlaceholder')}
        style={[s.input, { minHeight: 60, marginTop: 4 }]}
        value={notes ?? ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailsBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
