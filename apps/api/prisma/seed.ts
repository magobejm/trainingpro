/* eslint-disable @typescript-eslint/no-explicit-any, max-len */
import { LibraryItemScope, PrismaClient } from '@prisma/client';
import { CARDIO_METHOD_TYPES_V1 } from './seeds/v1-cardio-method-types.seed';
import { CARDIO_METHODS_V1 } from './seeds/v1-cardio-methods.seed';
import { CLIENT_OBJECTIVES_V1 } from './seeds/v1-client-objectives.seed';
import { ROUTINE_OBJECTIVES_V1 } from './seeds/v1-routine-objectives.seed';
import { EXERCISE_EQUIPMENT_V1 } from './seeds/v1-exercise-equipment.seed';
import { EXERCISE_MUSCLE_GROUPS_V1 } from './seeds/v1-exercise-muscle-groups.seed';
import { EXERCISES_V1 } from './seeds/v1-exercises.seed';
import { FOODS_V1 } from './seeds/v1-foods.seed';
import { MOBILITY_TYPES_V1 } from './seeds/v1-mobility-types.seed';
import { ISOMETRIC_EXERCISES_V1 } from './seeds/v1-isometric-exercises.seed';
import { ISOMETRIC_TYPES_V1 } from './seeds/v1-isometric-types.seed';
import { PLIO_EXERCISES_V1 } from './seeds/v1-plio-exercises.seed';
import { PLIO_TYPES_V1 } from './seeds/v1-plio-types.seed';
import { SPORT_TYPES_V1 } from './seeds/v1-sport-types.seed';
import { WARMUP_EXERCISES_V1 } from './seeds/v1-warmup-exercises.seed';
import { SPORTS_V1 } from './seeds/v1-sports.seed';
import { ROUTINE_TEMPLATES_V1 } from './seeds/v1-routine-templates.seed';
import { WARMUP_TEMPLATES_V1 } from './seeds/v1-warmup-templates.seed';
import { seedMovementPatterns } from './seeds/v3-movement-patterns.seed';
import { seedAnatomicalPlanes } from './seeds/v3-anatomical-planes.seed';
import { mapDayForSeed, readRequiredId } from './seeds/seed-utils';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedClientObjectives();
  await seedRoutineObjectives();
  await seedExerciseMuscleGroups();
  await seedCardioMethodTypes();
  await seedExerciseEquipment();
  await seedPlioTypes();
  await seedMobilityTypes();
  await seedSportTypes();
  await seedMovementPatterns(prisma);
  await seedAnatomicalPlanes(prisma);
  await seedExercises();
  await seedCardioMethods();
  await seedFoods();
  await seedIsometricTypes();
  await seedPlioExercises();
  await seedIsometricExercises();
  await seedWarmupExercises();
  await seedSports();
  await seedRoutineTemplates();
  await seedWarmupTemplates();
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

async function seedRoutineObjectives(): Promise<void> {
  for (const item of ROUTINE_OBJECTIVES_V1) {
    await (prisma as any).routineObjective.upsert({
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
  // Rename legacy sin_definir → undefined to match catalog convention
  await prisma.cardioMethodType.deleteMany({ where: { code: 'sin_definir' } });
  for (const item of CARDIO_METHOD_TYPES_V1) {
    await prisma.cardioMethodType.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedCardioMethods(): Promise<void> {
  const typeIndex = await readCatalogIndex('cardioMethodType');
  const equipmentIndex = await readCatalogIndex('exerciseEquipment');

  await prisma.cardioMethod.deleteMany({ where: { scope: LibraryItemScope.GLOBAL } });

  for (const item of CARDIO_METHODS_V1) {
    const equipmentId = equipmentIndex.get(item.equipmentCode) ?? null;
    await prisma.cardioMethod.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        methodTypeId: readRequiredId(typeIndex, item.methodTypeCode),
        name: item.name,
        scope: LibraryItemScope.GLOBAL,
        equipmentId,
        description: item.description ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
      },
      update: {
        archivedAt: null,
        methodTypeId: readRequiredId(typeIndex, item.methodTypeCode),
        name: item.name,
        equipmentId,
        description: item.description ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
      },
    });
  }
}

async function seedExerciseEquipment(): Promise<void> {
  for (const item of EXERCISE_EQUIPMENT_V1) {
    await prisma.exerciseEquipment.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedPlioTypes(): Promise<void> {
  for (const item of PLIO_TYPES_V1) {
    await prisma.plioTypeRef.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedMobilityTypes(): Promise<void> {
  for (const item of MOBILITY_TYPES_V1) {
    await prisma.mobilityTypeRef.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedSportTypes(): Promise<void> {
  for (const item of SPORT_TYPES_V1) {
    await prisma.sportTypeRef.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedExercises(): Promise<void> {
  const groupIndex = await readCatalogIndex('exerciseMuscleGroup');
  const equipmentIndex = await readCatalogIndex('exerciseEquipment');
  const patternIndex = await readCatalogIndex('movementPattern');
  const planeIndex = await readCatalogIndex('anatomicalPlane');

  // Delete all existing global exercises (and their assignments via cascade)
  await prisma.exercise.deleteMany({ where: { scope: LibraryItemScope.GLOBAL } });

  for (const item of EXERCISES_V1) {
    const equipmentId = equipmentIndex.get(item.equipmentCode) ?? null;
    const movementPatternId = patternIndex.get(item.movementPatternCode) ?? null;
    const anatomicalPlaneId = planeIndex.get(item.anatomicalPlaneCode) ?? null;
    await prisma.exercise.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        scope: LibraryItemScope.GLOBAL,
        equipmentId,
        movementPatternId,
        anatomicalPlaneId,
        instructions: item.instructions ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
      },
      update: {
        archivedAt: null,
        name: item.name,
        equipmentId,
        movementPatternId,
        anatomicalPlaneId,
        instructions: item.instructions ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
      },
    });
    for (const code of item.muscleGroupCodes) {
      const muscleGroupId = readRequiredId(groupIndex, code);
      await prisma.exerciseMuscleGroupAssignment.upsert({
        where: { exerciseId_muscleGroupId: { exerciseId: item.id, muscleGroupId } },
        create: { exerciseId: item.id, muscleGroupId },
        update: {},
      });
    }
  }
}

async function seedFoods(): Promise<void> {
  for (const item of FOODS_V1) {
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
        days: { create: tpl.days.map(mapDayForSeed) },
      },
      update: { name: tpl.name, scope: LibraryItemScope.GLOBAL },
    });
  }
}

async function seedIsometricTypes(): Promise<void> {
  for (const item of ISOMETRIC_TYPES_V1) {
    await (prisma as any).isometricTypeRef.upsert({
      where: { code: item.code },
      create: item,
      update: item,
    });
  }
}

async function seedPlioExercises(): Promise<void> {
  const equipmentIndex = await readCatalogIndex('exerciseEquipment');
  const plioTypeIndex = await readCatalogIndex('plioTypeRef' as any);

  await prisma.plioExercise.deleteMany({ where: { scope: LibraryItemScope.GLOBAL } });

  for (const item of PLIO_EXERCISES_V1) {
    const equipmentId = equipmentIndex.get(item.equipmentCode) ?? null;
    const plioTypeId = plioTypeIndex.get(item.plioTypeCode) ?? null;
    await prisma.plioExercise.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        plioTypeId,
        plioType: item.plioTypeCode,
        equipmentId,
        description: item.description ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
        scope: LibraryItemScope.GLOBAL,
      },
      update: {
        archivedAt: null,
        name: item.name,
        plioTypeId,
        plioType: item.plioTypeCode,
        equipmentId,
        description: item.description ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
        scope: LibraryItemScope.GLOBAL,
      },
    });
  }
}

async function seedIsometricExercises(): Promise<void> {
  const equipmentIndex = await readCatalogIndex('exerciseEquipment');
  const isoTypeIndex = await readCatalogIndex('isometricTypeRef' as any);

  await (prisma as any).isometricExercise.deleteMany({ where: { scope: LibraryItemScope.GLOBAL } });

  for (const item of ISOMETRIC_EXERCISES_V1) {
    const equipmentId = equipmentIndex.get(item.equipmentCode) ?? null;
    const isometricTypeId = isoTypeIndex.get(item.isometricTypeCode) ?? null;
    await (prisma as any).isometricExercise.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        isometricTypeId,
        isometricType: item.isometricTypeCode,
        equipmentId,
        description: item.description ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
        scope: LibraryItemScope.GLOBAL,
      },
      update: {
        archivedAt: null,
        name: item.name,
        isometricTypeId,
        isometricType: item.isometricTypeCode,
        equipmentId,
        description: item.description ?? null,
        coachInstructions: item.coachInstructions ?? null,
        youtubeUrl: item.youtubeUrl,
        scope: LibraryItemScope.GLOBAL,
      },
    });
  }
}

async function seedWarmupExercises(): Promise<void> {
  for (const item of WARMUP_EXERCISES_V1) {
    await prisma.mobilityExercise.upsert({
      where: { id: item.id },
      create: { id: item.id, name: item.name, scope: LibraryItemScope.GLOBAL },
      update: { archivedAt: null, name: item.name, scope: LibraryItemScope.GLOBAL },
    });
  }
}

async function seedSports(): Promise<void> {
  for (const item of SPORTS_V1) {
    await prisma.sport.upsert({
      where: { id: item.id },
      create: { id: item.id, name: item.name, icon: item.icon, description: item.description ?? null },
      update: { archivedAt: null, name: item.name, icon: item.icon, description: item.description ?? null },
    });
  }
}

async function seedWarmupTemplates(): Promise<void> {
  for (const tpl of WARMUP_TEMPLATES_V1) {
    await (prisma as any).warmupTemplate.upsert({
      where: { id: tpl.id },
      create: {
        id: tpl.id,
        name: tpl.name,
        scope: LibraryItemScope.GLOBAL,
        items: {
          create: tpl.items.map((item) => ({
            blockType: 'mobility',
            displayName: item.displayName,
            sortOrder: item.sortOrder,
            warmupExerciseLibraryId: item.warmupExerciseLibraryId,
            roundsPlanned: item.roundsPlanned,
            setsPlanned: item.setsPlanned ?? null,
            repsMin: item.repsMin ?? null,
            repsMax: item.repsMax ?? null,
            workSeconds: item.workSeconds ?? null,
            restSeconds: item.restSeconds ?? null,
          })),
        },
      },
      update: { name: tpl.name, scope: LibraryItemScope.GLOBAL },
    });
  }
}

async function readCatalogIndex(model: string): Promise<Map<string, string>> {
  const rows = await (prisma as any)[model].findMany({ select: { code: true, id: true } });
  return new Map(rows.map((row: any) => [row.code, row.id]));
}

main()
  .catch((error) => {
    console.error('Library seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
