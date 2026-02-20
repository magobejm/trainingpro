import { LibraryItemScope, PrismaClient } from '@prisma/client';
import { CARDIO_METHOD_TYPES_V1 } from './seeds/v1-cardio-method-types.seed';
import { CARDIO_METHODS_V1 } from './seeds/v1-cardio-methods.seed';
import { CLIENT_OBJECTIVES_V1 } from './seeds/v1-client-objectives.seed';
import { EXERCISE_MUSCLE_GROUPS_V1 } from './seeds/v1-exercise-muscle-groups.seed';
import { EXERCISES_V1 } from './seeds/v1-exercises.seed';
import { FOODS_V1 } from './seeds/v1-foods.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedClientObjectives();
  await seedExerciseMuscleGroups();
  await seedCardioMethodTypes();
  await seedExercises();
  await seedCardioMethods();
  await seedFoods();
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
    await prisma.food.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
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
      },
      update: {
        archivedAt: null,
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
