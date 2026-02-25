/* eslint-disable @typescript-eslint/no-explicit-any, max-len */
import { FieldMode, LibraryItemScope, PrismaClient } from '@prisma/client';
import { CARDIO_METHOD_TYPES_V1 } from './seeds/v1-cardio-method-types.seed';
import { CARDIO_METHODS_V1 } from './seeds/v1-cardio-methods.seed';
import { CLIENT_OBJECTIVES_V1 } from './seeds/v1-client-objectives.seed';
import { EXERCISE_MUSCLE_GROUPS_V1 } from './seeds/v1-exercise-muscle-groups.seed';
import { EXERCISES_V1 } from './seeds/v1-exercises.seed';
import { FOODS_V1 } from './seeds/v1-foods.seed';
import { PLIO_EXERCISES_V1 } from './seeds/v1-plio-exercises.seed';
import { WARMUP_EXERCISES_V1 } from './seeds/v1-warmup-exercises.seed';
import { SPORTS_V1 } from './seeds/v1-sports.seed';
import { ROUTINE_TEMPLATES_V1 } from './seeds/v1-routine-templates.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedClientObjectives();
  await seedExerciseMuscleGroups();
  await seedCardioMethodTypes();
  await seedExercises();
  await seedCardioMethods();
  await seedFoods();
  await seedPlioExercises();
  await seedWarmupExercises();
  await seedSports();
  await seedRoutineTemplates();
}

async function seedClientObjectives(): Promise<void> {
  for (const item of CLIENT_OBJECTIVES_V1) {
    await prisma.clientObjective.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        isDefault: item.isDefault,
        label: item.label,
        sortOrder: item.sortOrder,
      },
      update: {
        isDefault: item.isDefault,
        label: item.label,
        sortOrder: item.sortOrder,
      },
    });
  }
}

async function seedExerciseMuscleGroups(): Promise<void> {
  for (const item of EXERCISE_MUSCLE_GROUPS_V1) {
    await prisma.exerciseMuscleGroup.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedCardioMethodTypes(): Promise<void> {
  for (const item of CARDIO_METHOD_TYPES_V1) {
    await prisma.cardioMethodType.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedCardioMethods(): Promise<void> {
  const typeIndex = await readCardioMethodTypeIndex();
  for (const item of CARDIO_METHODS_V1) {
    await prisma.cardioMethod.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        methodTypeId: readRequiredId(typeIndex, item.methodTypeCode),
        name: item.name,
        scope: LibraryItemScope.GLOBAL,
      },
      update: {
        archivedAt: null,
        methodTypeId: readRequiredId(typeIndex, item.methodTypeCode),
        name: item.name,
        scope: LibraryItemScope.GLOBAL,
      },
    });
  }
}

async function seedExercises(): Promise<void> {
  const groupIndex = await readExerciseMuscleGroupIndex();
  for (const item of EXERCISES_V1) {
    await prisma.exercise.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        muscleGroupId: readRequiredId(groupIndex, item.muscleGroupCode),
        name: item.name,
        scope: LibraryItemScope.GLOBAL,
      },
      update: {
        archivedAt: null,
        muscleGroupId: readRequiredId(groupIndex, item.muscleGroupCode),
        name: item.name,
        scope: LibraryItemScope.GLOBAL,
      },
    });
  }
}

async function seedFoods(): Promise<void> {
  for (const item of FOODS_V1) {
    await upsertFood(item);
  }
}

async function upsertFood(item: (typeof FOODS_V1)[number]): Promise<void> {
  const data = {
    name: item.name,
    servingUnit: item.servingUnit,
    foodType: item.foodType,
    foodCategory: item.foodCategory,
    caloriesKcal: item.caloriesKcal,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    notes: item.notes ?? null,
    scope: LibraryItemScope.GLOBAL,
  };
  await prisma.food.upsert({
    where: { id: item.id },
    create: { id: item.id, ...data },
    update: { archivedAt: null, ...data },
  });
}

function mapExercisesForSeed(exercises: any[]) {
  return {
    create: (exercises ?? []).map((e) => ({
      displayName: e.displayName,
      sortOrder: e.sortOrder,
      fieldModes: {
        create: e.fieldModes.map((fm: any) => ({
          fieldKey: fm.fieldKey,
          mode: fm.mode as FieldMode,
        })),
      },
    })),
  };
}

function mapCardioBlocksForSeed(cardioBlocks: any[]) {
  return {
    create: (cardioBlocks ?? []).map((c: any) => ({
      displayName: c.displayName,
      sortOrder: c.sortOrder,
      workSeconds: c.workSeconds,
      restSeconds: c.restSeconds,
      fieldModes: {
        create: (c.fieldModes ?? []).map((fm: any) => ({
          fieldKey: fm.fieldKey,
          mode: fm.mode as FieldMode,
        })),
      },
    })),
  };
}

function mapTimedBlocksForSeed(blocks: any[]) {
  return {
    create: (blocks ?? []).map((b: any) => ({
      displayName: b.displayName,
      sortOrder: b.sortOrder,
      workSeconds: b.workSeconds,
      restSeconds: b.restSeconds,
    })),
  };
}

function mapDayForSeed(day: (typeof ROUTINE_TEMPLATES_V1)[number]['days'][number]) {
  return {
    title: day.title,
    dayIndex: day.dayIndex,
    exercises: mapExercisesForSeed(day.exercises as any[]),
    cardioBlocks: mapCardioBlocksForSeed(day.cardioBlocks as any[]),
    plioBlocks: mapTimedBlocksForSeed(day.plioBlocks as any[]),
    warmupBlocks: mapTimedBlocksForSeed(day.warmupBlocks as any[]),
    sportBlocks: {
      create: (day.sportBlocks ?? []).map((s) => ({
        displayName: s.displayName,
        sortOrder: s.sortOrder,
        durationMinutes: s.durationMinutes,
      })),
    },
  };
}

async function seedRoutineTemplates(): Promise<void> {
  for (const tpl of ROUTINE_TEMPLATES_V1) {
    await (prisma as any).planTemplate.upsert({
      where: { id: tpl.id },
      create: {
        id: tpl.id,
        name: tpl.name,
        kind: tpl.kind as any,
        scope: LibraryItemScope.GLOBAL,
        organizationId: null,
        coachMembershipId: null,
        createdBy: null,
        updatedBy: null,
        days: { create: tpl.days.map(mapDayForSeed) },
      },
      update: { name: tpl.name, scope: LibraryItemScope.GLOBAL },
    });
  }
}

async function seedPlioExercises(): Promise<void> {
  for (const item of PLIO_EXERCISES_V1) {
    await prisma.plioExercise.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        notes: item.notes ?? null,
        youtubeUrl: item.youtubeUrl ?? null,
        scope: LibraryItemScope.GLOBAL,
      },
      update: {
        archivedAt: null,
        name: item.name,
        notes: item.notes ?? null,
        youtubeUrl: item.youtubeUrl ?? null,
        scope: LibraryItemScope.GLOBAL,
      },
    });
  }
}

async function seedWarmupExercises(): Promise<void> {
  for (const item of WARMUP_EXERCISES_V1) {
    await prisma.warmupExercise.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        notes: item.notes ?? null,
        scope: LibraryItemScope.GLOBAL,
      },
      update: {
        archivedAt: null,
        name: item.name,
        notes: item.notes ?? null,
        scope: LibraryItemScope.GLOBAL,
      },
    });
  }
}

async function seedSports(): Promise<void> {
  for (const item of SPORTS_V1) {
    await prisma.sport.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        icon: item.icon,
        description: item.description ?? null,
      },
      update: {
        archivedAt: null,
        name: item.name,
        icon: item.icon,
        description: item.description ?? null,
      },
    });
  }
}

async function readCardioMethodTypeIndex(): Promise<Map<string, string>> {
  const rows = await prisma.cardioMethodType.findMany({ select: { code: true, id: true } });
  return new Map(rows.map((row) => [row.code, row.id]));
}

async function readExerciseMuscleGroupIndex(): Promise<Map<string, string>> {
  const rows = await prisma.exerciseMuscleGroup.findMany({ select: { code: true, id: true } });
  return new Map(rows.map((row) => [row.code, row.id]));
}

function readRequiredId(index: Map<string, string>, code: string): string {
  const id = index.get(code);
  if (id) {
    return id;
  }
  throw new Error(`Missing catalog seed for code: ${code}`);
}

main()
  .catch((error) => {
    console.error('Library seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
