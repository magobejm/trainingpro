import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_MUSCLE_GROUPS = [
  'sin_definir',
  'pectoral',
  'espalda',
  'deltoides',
  'biceps',
  'triceps',
  'cuadriceps',
  'femoral',
  'gluteo',
  'core',
  'aductor',
  'antebrazo',
  'gemelo',
  'espalda_baja',
];

const ALLOWED_CARDIO_TYPES = [
  'sin_definir',
  'calentamiento',
  'continuo_extensivo',
  'continuo_intensivo',
  'intervalos_aerobicos_extensivos',
  'intervalos_intensivos',
  'tempo_umbral',
  'hiit_corto',
  'hiit_largo',
  'anaerobico_lactico',
  'fartlek',
];

const ALLOWED_PLIO_TYPES = ['undefined', 'intensive', 'extensive'];

const ALLOWED_EQUIPMENT = [
  'undefined',
  'barbell', // Barra
  'dumbbell', // Mancuernas
  'cable', // Polea
  'machine', // Máquina
  'bodyweight', // Peso Corporal
  'band', // banda elástica
  'fitball', // fitball
  'medicine_ball', // balón medicinal
  'kettlebell', // kettlebell
];

async function cleanMuscleGroups() {
  const muscleDefault = await prisma.exerciseMuscleGroup.findFirst({ where: { isDefault: true } });
  if (!muscleDefault) return;

  const obsoleteMuscles = await prisma.exerciseMuscleGroup.findMany({
    where: { code: { notIn: ALLOWED_MUSCLE_GROUPS } },
  });

  if (obsoleteMuscles.length > 0) {
    const obsoleteIds = obsoleteMuscles.map((m) => m.id);
    await prisma.exerciseMuscleGroupAssignment.updateMany({
      where: { muscleGroupId: { in: obsoleteIds } },
      data: { muscleGroupId: muscleDefault.id },
    });
    await prisma.exerciseMuscleGroup.deleteMany({
      where: { id: { in: obsoleteIds } },
    });
    console.log(`Cleaned up ${obsoleteIds.length} obsolete muscle groups.`);
  }
}

async function cleanCardioTypes() {
  const cardioDefault = await prisma.cardioMethodType.findFirst({ where: { isDefault: true } });
  if (!cardioDefault) return;

  const obsoleteCardio = await prisma.cardioMethodType.findMany({
    where: { code: { notIn: ALLOWED_CARDIO_TYPES } },
  });

  if (obsoleteCardio.length > 0) {
    const obsoleteIds = obsoleteCardio.map((c) => c.id);
    await prisma.cardioMethod.updateMany({
      where: { methodTypeId: { in: obsoleteIds } },
      data: { methodTypeId: cardioDefault.id },
    });
    await prisma.cardioMethodType.deleteMany({
      where: { id: { in: obsoleteIds } },
    });
    console.log(`Cleaned up ${obsoleteIds.length} obsolete cardio types.`);
  }
}

async function cleanPlioTypes() {
  const plioDefault = await prisma.plioTypeRef.findFirst({ where: { isDefault: true } });
  if (!plioDefault) return;

  const obsoletePlio = await prisma.plioTypeRef.findMany({
    where: { code: { notIn: ALLOWED_PLIO_TYPES } },
  });

  if (obsoletePlio.length > 0) {
    const obsoleteIds = obsoletePlio.map((p) => p.id);
    await prisma.plioExercise.updateMany({
      where: { plioTypeId: { in: obsoleteIds } },
      data: { plioTypeId: plioDefault.id },
    });
    await prisma.plioTypeRef.deleteMany({
      where: { id: { in: obsoleteIds } },
    });
    console.log(`Cleaned up ${obsoleteIds.length} obsolete plio types.`);
  }
}

async function cleanEquipment() {
  const eqDefault = await prisma.exerciseEquipment.findFirst({ where: { isDefault: true } });
  if (!eqDefault) return;

  const obsoleteEq = await prisma.exerciseEquipment.findMany({
    where: { code: { notIn: ALLOWED_EQUIPMENT } },
  });

  if (obsoleteEq.length > 0) {
    const obsoleteIds = obsoleteEq.map((e) => e.id);
    const updates = [
      prisma.exercise.updateMany({ where: { equipmentId: { in: obsoleteIds } }, data: { equipmentId: eqDefault.id } }),
      prisma.cardioMethod.updateMany({ where: { equipmentId: { in: obsoleteIds } }, data: { equipmentId: eqDefault.id } }),
      prisma.plioExercise.updateMany({ where: { equipmentId: { in: obsoleteIds } }, data: { equipmentId: eqDefault.id } }),
    ];
    await Promise.all(updates);
    await prisma.exerciseEquipment.deleteMany({ where: { id: { in: obsoleteIds } } });
    console.log(`Cleaned up ${obsoleteIds.length} obsolete equipment records.`);
  }
}

async function main() {
  console.log('Starting catalog cleanup...');
  await cleanMuscleGroups();
  await cleanCardioTypes();
  await cleanPlioTypes();
  await cleanEquipment();
  console.log('Cleanup completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
