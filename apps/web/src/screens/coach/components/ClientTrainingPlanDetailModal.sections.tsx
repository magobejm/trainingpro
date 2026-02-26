import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type {
  RoutineDayInput,
  RoutineTemplateView,
  RoutineStrengthBlockInput,
  RoutineCardioBlockInput,
  RoutinePlioBlockInput,
  RoutineWarmupBlockInput,
  RoutineSportBlockInput,
} from '../../../data/hooks/useRoutineTemplates';
import { styles } from './ClientTrainingPlanDetailModal.styles';

type Translate = (k: string, options?: Record<string, unknown>) => string;

export function RoutineDetail({ routine, t }: { routine: RoutineTemplateView; t: Translate }) {
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.planName}>{routine.name}</Text>
      {routine.days.map((day) => (
        <DaySection day={day} key={day.dayIndex} t={t} />
      ))}
    </ScrollView>
  );
}

function DaySection({ day, t }: { day: RoutineDayInput; t: Translate }) {
  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayTitle}>{day.title}</Text>
      <DayBlockGroups day={day} t={t} />
    </View>
  );
}

function DayBlockGroups({ day, t }: { day: RoutineDayInput; t: Translate }) {
  const groups = buildDayGroups(day, t);
  return (
    <>
      {groups.map((group) => (
        <BlockGroup blocks={group.blocks} key={group.key} label={group.label} t={t} />
      ))}
    </>
  );
}

function buildDayGroups(day: RoutineDayInput, t: Translate) {
  return [
    buildStrengthGroup(day, t),
    buildCardioGroup(day, t),
    buildPlioGroup(day, t),
    buildWarmupGroup(day, t),
    buildSportGroup(day, t),
  ];
}

function buildStrengthGroup(day: RoutineDayInput, t: Translate) {
  const repsRange = (b: RoutineStrengthBlockInput) =>
    formatRepsRange(b.repsMin ?? null, b.repsMax ?? null);
  return {
    key: 'strength',
    label: t('coach.routine.blockType.strength'),
    blocks: day.exercises?.map((b: RoutineStrengthBlockInput) => ({
      name: b.displayName,
      meta: [
        fieldLabel(t('coach.routine.block.sets'), b.setsPlanned),
        fieldLabel(t('coach.routine.block.reps'), repsRange(b)),
        fieldLabel(t('coach.routine.block.rpe'), b.targetRpe),
      ],
    })),
  };
}

function buildCardioGroup(day: RoutineDayInput, t: Translate) {
  return {
    key: 'cardio',
    label: t('coach.routine.blockType.cardio'),
    blocks: day.cardioBlocks?.map((b: RoutineCardioBlockInput) => ({
      name: b.displayName,
      meta: [
        fieldLabel(t('coach.routine.block.rounds'), b.roundsPlanned),
        fieldLabel(t('coach.routine.block.work'), b.workSeconds),
        fieldLabel(t('coach.routine.block.rest'), b.restSeconds),
      ],
    })),
  };
}

function buildPlioGroup(day: RoutineDayInput, t: Translate) {
  return {
    key: 'plio',
    label: t('coach.routine.blockType.plio'),
    blocks: day.plioBlocks?.map((b: RoutinePlioBlockInput) => ({
      name: b.displayName,
      meta: [
        fieldLabel(t('coach.routine.block.rounds'), b.roundsPlanned),
        fieldLabel(t('coach.routine.block.work'), b.workSeconds),
        fieldLabel(t('coach.routine.block.rest'), b.restSeconds),
      ],
    })),
  };
}

function buildWarmupGroup(day: RoutineDayInput, t: Translate) {
  return {
    key: 'warmup',
    label: t('coach.routine.blockType.warmup'),
    blocks: day.warmupBlocks?.map((b: RoutineWarmupBlockInput) => ({
      name: b.displayName,
      meta: [
        fieldLabel(t('coach.routine.block.rounds'), b.roundsPlanned),
        fieldLabel(t('coach.routine.block.work'), b.workSeconds),
        fieldLabel(t('coach.routine.block.rest'), b.restSeconds),
      ],
    })),
  };
}

function buildSportGroup(day: RoutineDayInput, t: Translate) {
  return {
    key: 'sport',
    label: t('coach.routine.blockType.sport'),
    blocks: day.sportBlocks?.map((b: RoutineSportBlockInput) => ({
      name: b.displayName,
      meta: [
        fieldLabel(t('coach.routine.block.duration'), b.durationMinutes),
        fieldLabel(t('coach.routine.block.rpe'), b.targetRpe),
      ],
    })),
  };
}

type BlockInfo = {
  name: string;
  meta: Array<{ label: string; value: number | string | null | undefined }>;
};

function BlockGroup({ label, blocks, t }: { label: string; blocks?: BlockInfo[]; t: Translate }) {
  if (!blocks || blocks.length === 0) {
    return null;
  }
  return (
    <View style={styles.blockGroup}>
      <Text style={styles.blockGroupTitle}>{label}</Text>
      {blocks.map((block, idx) => (
        <BlockRow key={`${block.name}-${idx}`} label={block.name} meta={block.meta} t={t} />
      ))}
    </View>
  );
}

function BlockRow({
  label,
  meta,
  t,
}: {
  label: string;
  meta: Array<{ label: string; value: number | string | null | undefined }>;
  t: Translate;
}) {
  const visibleMeta = meta.filter((item) => item.value !== null && item.value !== undefined);
  return (
    <View style={styles.blockRow}>
      <Text style={styles.blockName}>{label}</Text>
      <BlockMetaLines meta={visibleMeta} t={t} />
    </View>
  );
}

function BlockMetaLines({ meta, t }: { meta: BlockInfo['meta']; t: Translate }) {
  if (meta.length === 0) {
    return <Text style={styles.blockMeta}>{t('coach.clientProfile.trainingPlan.noMeta')}</Text>;
  }
  const separator = t('coach.clientProfile.trainingPlan.separator');
  return (
    <Text style={styles.blockMeta}>
      {meta.map((item, idx) => (
        <MetaLine
          item={item}
          key={`${item.label}-${idx}`}
          separator={idx < meta.length - 1 ? separator : ''}
          t={t}
        />
      ))}
    </Text>
  );
}

function MetaLine({
  item,
  separator,
  t,
}: {
  item: BlockInfo['meta'][number];
  separator: string;
  t: Translate;
}) {
  return (
    <Text>
      {t('coach.clientProfile.trainingPlan.metaLine', {
        label: item.label,
        value: item.value,
      })}
      {separator}
    </Text>
  );
}

function fieldLabel(label: string, value: number | string | null | undefined) {
  return { label, value };
}

function formatRepsRange(repsMin: number | null | undefined, repsMax: number | null | undefined) {
  if (repsMin == null && repsMax == null) {
    return null;
  }
  if (repsMin == null) {
    return `${repsMax}`;
  }
  if (repsMax == null || repsMin === repsMax) {
    return `${repsMin}`;
  }
  return `${repsMin}-${repsMax}`;
}
