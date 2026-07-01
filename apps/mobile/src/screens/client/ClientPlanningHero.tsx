import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientRoutine } from '../../data/hooks/useClientRoutineQuery';
import { LIGHT } from '../../theme/light';

type Props = {
  routine: ClientRoutine;
};

export function PlanHero({ routine }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const trainingDays = routine.planDays.length;
  return (
    <View style={styles.hero}>
      <Text style={styles.label}>{t('client.planning.mesocycle')}</Text>
      <Text style={styles.name}>{routine.name}</Text>
      <View style={styles.chipRow}>
        <Chip text={t('client.planning.trainingDays', { count: trainingDays })} />
        {routine.expectedCompletionDays ? (
          <Chip text={t('client.planning.cycleLength', { count: routine.expectedCompletionDays })} />
        ) : null}
        {routine.objectives.map((obj) => (
          <Chip key={obj} text={obj} accent />
        ))}
      </View>
    </View>
  );
}

function Chip({ text, accent }: { text: string; accent?: boolean }): React.JSX.Element {
  return (
    <View style={[styles.chip, accent ? styles.chipAccent : null]}>
      <Text style={[styles.chipText, accent ? styles.chipTextAccent : null]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipAccent: { backgroundColor: LIGHT.accentSoft, borderColor: LIGHT.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chipText: { color: LIGHT.accentDark, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  chipTextAccent: { color: LIGHT.accent },
  hero: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
  },
  label: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  name: { color: LIGHT.textStrong, fontSize: 22, fontWeight: '800', marginTop: 4 },
});
