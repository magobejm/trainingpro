import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineExercise, ClientRoutineSet } from '../../data/hooks/useClientRoutineQuery';
import { LIGHT } from '../../theme/light';

export function RoutineExerciseNotes(props: { exercise: ClientRoutineExercise }): React.JSX.Element | null {
  const { t } = useTranslation();
  const ex = props.exercise;
  const setNotes = ex.sets.filter((set) => set.note?.trim() || set.advancedTechnique?.trim());

  const sections = [
    ex.coachInstructions?.trim()
      ? { key: 'instructions', label: t('client.notes.exerciseInstructions'), text: ex.coachInstructions.trim() }
      : null,
    ex.notes?.trim() ? { key: 'trainer', label: t('client.notes.trainerNote'), text: ex.notes.trim() } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; text: string }>;

  if (sections.length === 0 && setNotes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={styles.label}>{section.label}</Text>
          <Text style={styles.text}>{section.text}</Text>
        </View>
      ))}
      {setNotes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('client.notes.setNotes')}</Text>
          {setNotes.map((set) => (
            <Text key={set.setIndex} style={styles.text}>
              {formatRoutineSetLine(set, t('client.notes.advancedTechnique'))}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function formatRoutineSetLine(set: ClientRoutineSet, techniqueLabel: string): string {
  const parts: string[] = [`${set.setIndex + 1}.`];
  if (set.advancedTechnique?.trim()) {
    parts.push(`${techniqueLabel}: ${set.advancedTechnique.trim()}`);
  }
  if (set.note?.trim()) {
    parts.push(set.note.trim());
  }
  return parts.join(' ');
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 8,
  },
  label: {
    color: LIGHT.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  section: {
    gap: 4,
  },
  text: {
    color: LIGHT.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
