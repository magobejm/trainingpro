import { BadRequestException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow, Prisma } from '@prisma/client';
import {
  applyCommandRulesToSet,
  applyCommandSetCount,
  commandChoice,
  normalizeCommandRules,
  previewCommandExercise,
  previewCommandTimedSets,
  rulesForChoice,
  type CommandApplyRequest,
  type CommandApplyResponse,
  type CommandItemRef,
  type CommandRule,
  type CommandWarning,
  type RoutineEditorBlock,
  type RoutineEditorExercise,
} from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { buildWeek } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };

type ExercisePlan = { exercise: RoutineEditorExercise; rules: CommandRule[]; setIndexes?: number[] };
type BlockPlan = { block: RoutineEditorBlock; rules: CommandRule[]; setIndexes?: number[] };

function timedValues(set: RoutineEditorBlock['sets'][number]) {
  return {
    distanceMeters: set.distanceMeters,
    durationSeconds: set.durationSeconds,
    fcMaxPct: set.fcMaxPct,
    heartRate: set.heartRate,
  };
}

function orderedBlockSets(block: RoutineEditorBlock) {
  return [...block.sets].sort((a, b) => a.setIndex - b.setIndex);
}

/** Cardio sets take all four timed variables; isometric sets only have a duration. A listed set leaves the rest. */
async function writeBlock(tx: Prisma.TransactionClient, { block, rules, setIndexes }: BlockPlan) {
  const sets = orderedBlockSets(block);
  const rows = previewCommandTimedSets(sets.map(timedValues), rules);
  const indexes = setIndexes ?? rows.map((_, index) => index);
  for (const index of indexes) {
    const row = rows[index];
    const id = sets[index]?.id;
    if (!row || !id) continue;
    if (block.kind === 'cardio') await tx.planCardioSet.update({ data: row.after, where: { id } });
    else await tx.planIsometricSet.update({ data: { durationSeconds: row.after.durationSeconds }, where: { id } });
  }
}

function changedBlockSets(block: RoutineEditorBlock, rules: CommandRule[], setIndexes?: number[]): number {
  const rows = previewCommandTimedSets(orderedBlockSets(block).map(timedValues), rules);
  const chosen = setIndexes ? setIndexes.flatMap((index) => (rows[index] ? [rows[index]] : [])) : rows;
  const keys = block.kind === 'cardio' ? null : (['durationSeconds'] as const);
  return chosen.filter((row) =>
    (keys ?? (Object.keys(row.after) as Array<keyof typeof row.after>)).some((key) => row.before[key] !== row.after[key]),
  ).length;
}

function values(set: RoutineEditorExercise['sets'][number]) {
  return { reps: set.reps, restSeconds: set.restSeconds, rir: set.rir, rpe: set.rpe, weightKg: set.weightKg };
}

/** Weeks to touch: the selected ones that belong to the routine, plus later ones when the coach asked for it. */
export function targetWeeks(routine: Routine, input: CommandApplyRequest): WeekRow[] {
  const selected = routine.weeks.filter((week) => input.weekIds.includes(week.id));
  if (selected.length !== new Set(input.weekIds).size) throw new BadRequestException('Unknown week in the selection');
  if (!input.cascade || selected.length === 0) return selected;
  const last = Math.max(...selected.map((week) => week.weekIndex));
  const later = routine.weeks.filter((week) => week.weekIndex > last && !input.weekIds.includes(week.id));
  return [...selected, ...later].sort((a, b) => a.weekIndex - b.weekIndex);
}

function orderedSets(exercise: RoutineEditorExercise) {
  return [...exercise.sets].sort((a, b) => a.setIndex - b.setIndex);
}

async function writeExercise(tx: Prisma.TransactionClient, { exercise, rules, setIndexes }: ExercisePlan) {
  const existing = orderedSets(exercise);
  if (setIndexes) {
    for (const index of setIndexes) {
      const current = existing[index];
      if (!current) continue;
      const after = applyCommandRulesToSet(values(current), rules).after;
      await tx.planStrengthSet.update({ data: after, where: { id: current.id } });
    }
    return;
  }
  const preview = previewCommandExercise(existing.map(values), rules);
  for (const [index, item] of preview.entries()) {
    const current = existing[index];
    if (current) {
      await tx.planStrengthSet.update({ data: item.after, where: { id: current.id } });
    } else {
      await tx.planStrengthSet.create({ data: { ...item.after, exerciseId: exercise.id, setIndex: index } });
    }
  }
  const surplus = existing.slice(preview.length).map((set) => set.id);
  if (surplus.length) await tx.planStrengthSet.deleteMany({ where: { id: { in: surplus } } });
  await tx.planStrengthExercise.update({ data: { setsPlanned: preview.length }, where: { id: exercise.id } });
}

function changedCount(exercise: RoutineEditorExercise, rules: CommandRule[], setIndexes?: number[]): number {
  const existing = orderedSets(exercise);
  if (setIndexes) {
    return setIndexes.filter((index) => {
      const current = existing[index];
      if (!current) return false;
      const after = applyCommandRulesToSet(values(current), rules).after;
      return JSON.stringify(values(current)) !== JSON.stringify(after);
    }).length;
  }
  const preview = previewCommandExercise(existing.map(values), rules);
  const sizeChange = Math.abs(applyCommandSetCount(exercise.sets.length, rules) - exercise.sets.length);
  const edited = preview
    .slice(0, exercise.sets.length)
    .filter((item) => JSON.stringify(item.before) !== JSON.stringify(item.after));
  return edited.length + sizeChange;
}

/** One transaction for the whole command: either every week changes or none does. */
export async function applyProgression(
  prisma: PrismaService,
  routine: Routine,
  input: CommandApplyRequest,
): Promise<CommandApplyResponse> {
  const normalized = normalizeCommandRules(input.rules);
  if (normalized.length === 0) throw new BadRequestException('At least one rule is required');
  const today = todayKey();
  const plans: ExercisePlan[] = [];
  const blockPlans: BlockPlan[] = [];
  const warnings = new Set<CommandWarning>();
  let skippedLockedDays = 0;
  let touchedWeeks = 0;
  for (const week of targetWeeks(routine, input)) {
    const view = await buildWeek(prisma, routine, week, today);
    const days = view.days.filter((day) => input.dayIndexes.length === 0 || input.dayIndexes.includes(day.dayIndex));
    const open = days.filter((day) => day.editable);
    skippedLockedDays += days.length - open.length;
    if (open.length > 0) touchedWeeks += 1;
    for (const day of open) {
      for (const exercise of day.exercises) {
        const ref: CommandItemRef = {
          dayIndex: day.dayIndex,
          displayName: exercise.displayName,
          kind: 'exercise',
          sortOrder: exercise.sortOrder,
        };
        const choice = commandChoice(ref, normalized, input.target);
        if (!choice) continue;
        const itemRules = rulesForChoice(normalized, choice);
        const existing = orderedSets(exercise);
        const previewSets = choice.setIndexes
          ? choice.setIndexes.flatMap((index) => (existing[index] ? [existing[index]] : []))
          : existing;
        for (const item of previewCommandExercise(previewSets.map(values), itemRules))
          item.warnings.forEach((warning) => warnings.add(warning));
        plans.push({ exercise, rules: itemRules, setIndexes: choice.setIndexes });
      }
      for (const block of day.blocks) {
        if (block.kind !== 'cardio' && block.kind !== 'isometric') continue;
        if (block.sets.length === 0) continue;
        const choice = commandChoice(
          { dayIndex: day.dayIndex, displayName: block.displayName, kind: block.kind, sortOrder: block.sortOrder },
          normalized,
          input.target,
        );
        if (!choice) continue;
        blockPlans.push({ block, rules: rulesForChoice(normalized, choice), setIndexes: choice.setIndexes });
      }
    }
  }
  const changedSets =
    plans.reduce((total, plan) => total + changedCount(plan.exercise, plan.rules, plan.setIndexes), 0) +
    blockPlans.reduce((total, plan) => total + changedBlockSets(plan.block, plan.rules, plan.setIndexes), 0);
  await prisma.$transaction(
    async (tx) => {
      for (const plan of plans) await writeExercise(tx, plan);
      for (const plan of blockPlans) await writeBlock(tx, plan);
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
  return { changedSets, skippedLockedDays, touchedWeeks, warnings: [...warnings] };
}
