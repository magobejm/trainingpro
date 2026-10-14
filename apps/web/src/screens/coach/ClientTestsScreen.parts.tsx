import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { type PhysicalTestView } from '../../data/hooks/usePhysicalTests';

import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';
import type { ClientTestsViewModel } from './ClientTestsScreen';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

type ViewModel = ClientTestsViewModel;

export function TestCard(props: {
  assigned: boolean;
  expanded: boolean;
  onAssign: () => void;
  onOpenRoute: () => void;
  onOpenTables: () => void;
  onToggle: () => void;
  onUnassign: () => void;
  scheduledDates: string[];
  t: ViewModel['t'];
  test: PhysicalTestView;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Pressable onPress={props.onToggle} style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{props.test.name}</Text>
          <Text style={styles.cardMeta}>{`${props.test.category} · ${props.test.level}`}</Text>
          {props.scheduledDates.length > 0 ? (
            <Text style={styles.cardMeta}>
              {props.t('coach.tests.schedule.dates', { dates: formatScheduledDates(props.scheduledDates) })}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>{props.expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {props.expanded ? (
        <View style={styles.cardBody}>
          <Text style={styles.sectionLabel}>{props.t('coach.tests.objective')}</Text>
          <Text style={styles.sectionText}>{props.test.objective}</Text>
          <Text style={styles.sectionLabel}>{props.t('coach.tests.instructions')}</Text>
          <Text style={styles.sectionText}>{props.test.whatToDo}</Text>
          <Text style={styles.sectionLabel}>{props.t('coach.tests.measure')}</Text>
          <Text style={styles.sectionText}>{props.test.whatToMeasure}</Text>
          {props.test.options ? (
            <>
              <Text style={styles.sectionLabel}>{props.t('coach.tests.options')}</Text>
              <Text style={styles.sectionText}>{`${props.t('coach.tests.economic')}: ${props.test.options.economic}`}</Text>
              <Text style={styles.sectionText}>{`${props.t('coach.tests.pro')}: ${props.test.options.pro}`}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Button
          label={props.t('coach.tests.actions.tables')}
          onPress={props.onOpenTables}
          size={SIZE_SM}
          variant={VARIANT_SECONDARY}
        />
        <Button
          label={props.t('coach.tests.actions.route')}
          onPress={props.onOpenRoute}
          size={SIZE_SM}
          variant={VARIANT_SECONDARY}
        />
        <Button
          label={props.assigned ? props.t('coach.tests.actions.unassign') : props.t('coach.tests.actions.assign')}
          onPress={props.assigned ? props.onUnassign : props.onAssign}
          size={SIZE_SM}
          variant={props.assigned ? VARIANT_SECONDARY : undefined}
        />
      </View>
    </View>
  );
}

export function ToggleButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleButton, props.active && styles.toggleButtonActive]}>
      <Text style={[styles.toggleLabel, props.active && styles.toggleLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

export function CategoryChip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={[styles.chipLabel, props.active && styles.chipLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

export function filterTests(items: PhysicalTestView[], search: string, category: string): PhysicalTestView[] {
  return items.filter((item) => matchesFilters(item, search, category));
}

function matchesFilters(item: PhysicalTestView, search: string, category: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch =
    normalizedSearch.length === 0 ||
    item.name.toLowerCase().includes(normalizedSearch) ||
    item.category.toLowerCase().includes(normalizedSearch);
  const matchesCategory = category.length === 0 || item.category === category;
  return matchesSearch && matchesCategory;
}

export async function recordResultEnsuringAssignment(
  props: ViewModel,
  testId: string,
  inputs: Parameters<ViewModel['recordMutation']['mutateAsync']>[0]['inputs'],
): Promise<void> {
  if (!props.assignedIds.has(testId)) {
    try {
      await props.assignMutation.mutateAsync(testId);
    } catch {
      // Already assigned or race; recording still requires a persisted assignment.
    }
  }
  const result = await props.recordMutation.mutateAsync({ inputs, testId });
  props.setLastResult(result);
}

function formatScheduledDates(dates: string[]): string {
  return [...dates]
    .map((value) => value.slice(0, 10))
    .sort()
    .map((value) => {
      const [year, month, day] = value.split('-');
      return year && month && day ? `${day}/${month}/${year}` : value;
    })
    .join(', ');
}

export function resolveAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export const styles = StyleSheet.create({
  page: {
    gap: space.lg,
    paddingBottom: space.xl,
  },
  header: {
    gap: space.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  toggleButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  toggleLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: colors.primary,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.onPrimary,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: space.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  cardBody: {
    gap: space.sm,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  sectionText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
