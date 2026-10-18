import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@trainerpro/ui';
import Svg, { Path } from 'react-native-svg';
import { buildExerciseBlocks, type ClientRoutineWarmup } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';
import { ExerciseCard } from './ExerciseCard';
const WARMUP_ICON = 'warmup' as const;
const ROUTINE_ICON = 'routine' as const;
const ICON_VIEW_BOX = '0 0 24 24';
const ICON_FILL = 'none';

export function warmupExerciseCount(warmups: ClientRoutineWarmup[] = []) {
  return warmups.reduce((count, warmup) => count + warmup.exercises.length, 0);
}

export function WarmupBadge({ warmups }: { warmups?: ClientRoutineWarmup[] }) {
  const { t } = useTranslation();
  const count = warmupExerciseCount(warmups);
  return count ? <Text style={styles.badge}>{t('mobile.client.warmup.badge', { count })}</Text> : null;
}

export function RoutineBlock({
  warmups,
  count,
  active = false,
  children,
}: {
  warmups?: ClientRoutineWarmup[];
  count: number;
  active?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (!warmupExerciseCount(warmups)) return <>{children}</>;
  return (
    <WorkoutSection
      title={t('mobile.client.warmup.routine')}
      subtitle={t('mobile.client.warmup.routineSubtitle')}
      count={count}
      initialOpen={!active}
      icon={ROUTINE_ICON}
    >
      {children}
    </WorkoutSection>
  );
}

export function WorkoutSection({
  title,
  subtitle,
  count,
  initialOpen,
  children,
  icon,
}: {
  title: string;
  subtitle: string;
  count: number;
  initialOpen: boolean;
  children: React.ReactNode;
  icon: 'warmup' | 'routine';
}) {
  const [open, setOpen] = useState(initialOpen);
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        onPress={() => setOpen((prev) => !prev)}
        style={styles.sectionHeader}
      >
        <View style={styles.icon}>
          <Svg width={20} height={20} viewBox={ICON_VIEW_BOX} fill={ICON_FILL} stroke={LIGHT.accent} strokeWidth={1.7}>
            <Path
              d={
                icon === 'warmup'
                  ? 'M12 3c1 4 6 5 6 11a6 6 0 0 1-12 0c0-2 1-4 3-6 0 3 1 4 2 4 2-2 2-5 1-9Z'
                  : 'M5 3 3 5l16 16 2-2ZM3 9l6-6m6 18 6-6M2 6l4-4m12 20 4-4'
              }
            />
          </Svg>
        </View>
        <View style={styles.heading}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.badge}>{t('mobile.client.warmup.count', { count })}</Text>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

/** Consultation only: no session identifiers, result drafts or mutation callbacks enter this component. */
export function WorkoutWarmups({ warmups = [], active = false }: { warmups?: ClientRoutineWarmup[]; active?: boolean }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const exercises = warmups.flatMap((warmup) => warmup.exercises);
  if (!exercises.length) return null;
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <>
      <WorkoutSection
        title={t('mobile.client.warmup.title')}
        subtitle={t('mobile.client.warmup.subtitle')}
        count={exercises.length}
        initialOpen={active}
        icon={WARMUP_ICON}
      >
        <Text style={styles.subtitle}>{t('mobile.client.warmup.instructionsOnly')}</Text>
        {warmups.map((warmup) => (
          <View key={warmup.id} style={styles.warmup}>
            {warmups.length > 1 ? <Text style={styles.title}>{warmup.name}</Text> : null}
            {warmup.description ? <Text style={styles.subtitle}>{warmup.description}</Text> : null}
            {buildExerciseBlocks(warmup.exercises).map((block) => (
              <View
                key={block.exercises.map((exercise) => exercise.id).join(':')}
                style={block.type === 'single' ? styles.single : styles.group}
              >
                {block.type !== 'single' ? (
                  <Text style={styles.groupTitle}>
                    {t(block.type === 'superset' ? 'mobile.client.session.superset' : 'mobile.client.session.circuit')}
                  </Text>
                ) : null}
                {block.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    expanded={!active && expanded.has(exercise.id)}
                    onToggle={() => (active ? setSelected(exercises.indexOf(exercise)) : toggle(exercise.id))}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
      </WorkoutSection>
      {selected !== null && exercises[selected] ? (
        <Modal
          visible
          title={t('mobile.client.warmup.title')}
          closeLabel={t('mobile.client.warmup.close')}
          onClose={() => setSelected(null)}
          footer={
            <>
              <Button
                label={t('mobile.client.warmup.previous')}
                variant="secondary"
                disabled={selected === 0}
                onPress={() => setSelected(selected - 1)}
              />
              <Button
                label={t('mobile.client.warmup.next')}
                variant="secondary"
                disabled={selected === exercises.length - 1}
                onPress={() => setSelected(selected + 1)}
              />
            </>
          }
        >
          <Text style={styles.subtitle}>{t('mobile.client.warmup.instructionsOnly')}</Text>
          <ExerciseCard
            key={exercises[selected].id}
            exercise={exercises[selected]}
            expanded
            onToggle={() => setSelected(null)}
          />
        </Modal>
      ) : null}
    </>
  );
}

export const warmupStyles = StyleSheet.create({
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: LIGHT.border,
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radius2xl,
    marginBottom: 16,
  },
  sectionHeader: { minHeight: 64, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  heading: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  title: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '700' },
  subtitle: { color: LIGHT.accent, fontSize: 12, lineHeight: 18 },
  badge: {
    color: LIGHT.accent,
    borderColor: LIGHT.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
  },
  icon: { color: LIGHT.accent, backgroundColor: LIGHT.accentSoft, padding: 8, borderRadius: 12 },
  chevron: { color: LIGHT.accent, fontSize: 22 },
  content: { borderTopWidth: 1, borderTopColor: LIGHT.border, padding: 12, gap: 8 },
  warmup: { gap: 8 },
  single: { gap: 8 },
  group: { borderWidth: 1, borderColor: LIGHT.border, borderRadius: LIGHT.radius2xl, padding: 8, gap: 8 },
  groupTitle: { color: LIGHT.accentDark, fontSize: 11, fontWeight: '700' },
});
