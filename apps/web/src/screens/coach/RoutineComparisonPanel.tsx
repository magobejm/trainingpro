import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';
import type { RoutineComparison, RoutineChange } from '@trainerpro/shared';
import { fieldLabel, valueLabel, visibleComparisonField, type Translate } from './routine-comparison-display';

export function RoutineComparisonPanel({ comparison, t }: { comparison: RoutineComparison; t: Translate }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{t('routineVersions.changes')}</Text>
      {comparison.changes.length ? (
        <View style={styles.columns}>
          {(['Days', 'Exercises'] as const).map((scope) => (
            <View key={scope} style={styles.summary}>
              <Text style={styles.heading}>{t(`routineVersions.${scope.toLowerCase()}`)}</Text>
              <View style={styles.badges}>
                {(['added', 'removed', 'modified'] as const).map((kind) => (
                  <Text key={kind} style={[styles.badge, styles[kind]]}>
                    {comparison[`${kind}${scope}`]} {t(`routineVersions.counts.${kind}`)}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.text}>{t('routineVersions.noChanges')}</Text>
      )}
      {comparison.changes.length ? (
        <Button
          variant="secondary"
          label={t(expanded ? 'routineVersions.hideDetails' : 'routineVersions.showDetails')}
          onPress={() => setExpanded(!expanded)}
        />
      ) : null}
      {expanded ? comparison.changes.map((change, index) => <ChangeRow key={index} change={change} t={t} />) : null}
    </View>
  );
}
function ChangeRow({ change, t }: { change: RoutineChange; t: Translate }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Text style={styles.caption}>
            {change.dayIndex !== null ? `${t('routineVersions.day')} ${change.dayIndex}` : t('routineVersions.routine')}
          </Text>
          <Text style={styles.heading}>{change.title}</Text>
        </View>
        <Text style={[styles.badge, styles[change.kind]]}>{t(`routineVersions.${change.kind}`)}</Text>
      </View>
      {change.fields
        .filter((field) => visibleComparisonField(field.field))
        .map((field) => (
          <View key={field.field} style={styles.field}>
            <Text style={styles.fieldHeading}>{fieldLabel(field.field, t)}</Text>
            <View style={styles.columns}>
              {(['before', 'after'] as const).map((side) => (
                <View key={side} style={[styles.value, side === 'after' && styles.proposed]}>
                  <Text style={styles.caption}>{t(`routineVersions.${side}`)}</Text>
                  <Text style={styles.text}>{valueLabel(field[side], t, field.field.split('.').at(-1))}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { gap: space.md, paddingVertical: space.sm },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  summary: {
    flexGrow: 1,
    flexBasis: 240,
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surfaceMuted,
  },
  titleGroup: { flex: 1, gap: space.xs },
  field: { gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: colors.border },
  value: {
    flexGrow: 1,
    flexBasis: 230,
    minWidth: 0,
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  proposed: { backgroundColor: colors.primarySoft },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    fontSize: fontSize.xs,
    fontWeight: '600',
    overflow: 'hidden',
  },
  added: { color: colors.success, backgroundColor: colors.successSoft },
  removed: { color: colors.danger, backgroundColor: colors.dangerSoft },
  modified: { color: colors.info, backgroundColor: colors.infoSoft },
  moved: { color: colors.warning, backgroundColor: colors.warningSoft },
  caption: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  fieldHeading: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  text: { color: colors.text, fontSize: fontSize.sm, lineHeight: 22 },
});
