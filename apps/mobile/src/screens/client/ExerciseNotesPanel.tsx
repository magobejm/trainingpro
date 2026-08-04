import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

export type PlannedSetNote = {
  advancedTechnique?: null | string;
  note?: null | string;
  setIndex: number;
};

type ExerciseNotesPanelProps = {
  coachInstructions?: null | string;
  trainerNote?: null | string;
  plannedSet?: PlannedSetNote | null;
};

export function ExerciseNotesPanel(props: ExerciseNotesPanelProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const sections = [
    props.coachInstructions?.trim()
      ? { key: 'instructions', label: t('client.notes.exerciseInstructions'), text: props.coachInstructions.trim() }
      : null,
    props.trainerNote?.trim()
      ? { key: 'trainer', label: t('client.notes.trainerNote'), text: props.trainerNote.trim() }
      : null,
    props.plannedSet?.advancedTechnique?.trim() || props.plannedSet?.note?.trim()
      ? {
          key: 'set',
          label: t('client.notes.setNote', { n: (props.plannedSet?.setIndex ?? 0) + 1 }),
          text: formatPlannedSetText(props.plannedSet, t('client.notes.advancedTechnique')),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; text: string }>;

  if (sections.length === 0) {
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
    </View>
  );
}

function formatPlannedSetText(plannedSet: PlannedSetNote | null | undefined, techniqueLabel: string): string {
  if (!plannedSet) return '';
  const parts: string[] = [];
  if (plannedSet.advancedTechnique?.trim()) {
    parts.push(`${techniqueLabel}: ${plannedSet.advancedTechnique.trim()}`);
  }
  if (plannedSet.note?.trim()) {
    parts.push(plannedSet.note.trim());
  }
  return parts.join('\n');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 12,
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
    gap: 2,
  },
  text: {
    color: LIGHT.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
