import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClientPhysicalTestAssignmentView, TestInputs } from '../../data/hooks/usePhysicalTests';

export type CompletedTestRow = {
  classification: string;
  classificationColor: string | null;
  date: string;
  id: string;
  inputs: TestInputs;
  rawScore: string;
  testName: string;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function buildCompletedRows(
  assignments: ClientPhysicalTestAssignmentView[],
  search: string,
  category: string,
): CompletedTestRow[] {
  const needle = search.trim().toLowerCase();
  const rows: CompletedTestRow[] = [];
  for (const assignment of assignments) {
    const test = assignment.physicalTest;
    const matchesSearch = needle.length === 0 || test.name.toLowerCase().includes(needle);
    if (!matchesSearch || (category && test.category !== category)) continue;
    for (const result of assignment.results ?? []) {
      const scheduled = assignment.schedules?.find((item) => item.resultId === result.id);
      rows.push({
        classification: result.classification,
        classificationColor: result.classificationColor,
        date: scheduled?.scheduledDate ?? result.measuredAt.slice(0, 10),
        id: result.id,
        inputs: result.inputsJson,
        rawScore: result.rawScore,
        testName: test.name,
      });
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export function CompletedTestList(props: { rows: CompletedTestRow[]; t: Translate }): React.JSX.Element {
  if (props.rows.length === 0) {
    return <Text style={styles.empty}>{props.t('coach.tests.completed.empty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {props.rows.map((row) => (
        <View key={row.id} style={styles.card}>
          <Text style={styles.name}>{row.testName}</Text>
          <Text style={styles.meta}>{props.t('coach.tests.completed.date', { date: row.date })}</Text>
          <Text style={styles.score}>{`${props.t('coach.tests.completed.score')}: ${row.rawScore}`}</Text>
          <Text style={[styles.classification, { color: classificationTint(row.classification) }]}>
            {`${props.t('coach.tests.completed.classification')}: ${row.classification}`}
          </Text>
          <Text style={styles.inputs}>{formatInputs(row.inputs)}</Text>
        </View>
      ))}
    </View>
  );
}

function classificationTint(classification: string): string {
  const value = classification.toLowerCase();
  if (value.includes('pobre') || value.includes('debajo')) return '#b91c1c';
  if (value.includes('regular')) return '#c2410c';
  if (value.includes('medio') || value.includes('media') || value.includes('normal')) return '#a16207';
  if (value.includes('excelente') || value.includes('superior') || value.includes('élite') || value.includes('elite')) {
    return '#047857';
  }
  if (value.includes('bueno') || value.includes('encima')) return '#1d4ed8';
  return '#0e1a2f';
}

function formatInputs(inputs: TestInputs): string {
  return Object.entries(inputs)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderColor: '#dbe4f0', borderRadius: 14, borderWidth: 1, gap: 4, padding: 14 },
  classification: { fontSize: 14, fontWeight: '800' },
  empty: { color: '#627285', fontSize: 14, paddingVertical: 12 },
  inputs: { color: '#334155', fontSize: 12 },
  list: { gap: 10 },
  meta: { color: '#627285', fontSize: 12 },
  name: { color: '#0e1a2f', fontSize: 16, fontWeight: '700' },
  score: { color: '#0e1a2f', fontSize: 14, fontWeight: '600' },
});
