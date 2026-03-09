import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PATTERNS = [
  { code: 'horizontal_push', label: 'Empuje horizontal', sortOrder: 1 },
  { code: 'vertical_push', label: 'Empuje vertical', sortOrder: 2 },
  { code: 'horizontal_pull', label: 'Tracción horizontal', sortOrder: 3 },
  { code: 'vertical_pull', label: 'Tracción vertical', sortOrder: 4 },
  { code: 'knee_dominant', label: 'Dominante de rodilla', sortOrder: 5 },
  { code: 'hip_hinge', label: 'Bisagra de cadera', sortOrder: 6 },
  { code: 'hip_thrust', label: 'Empuje de cadera', sortOrder: 7 },
  { code: 'rotation_anti', label: 'Rotación/Anti-rotación', sortOrder: 8 },
  { code: 'stabilization', label: 'Estabilización', sortOrder: 9 },
  { code: 'locomotion', label: 'Locomoción y transporte', sortOrder: 10 },
  { code: 'elbow_flexion', label: 'Flexión de codo', sortOrder: 11 },
  { code: 'elbow_extension', label: 'Extensión de codo', sortOrder: 12 },
];

const PLANES = [
  { code: 'sagittal', label: 'Sagital', sortOrder: 1 },
  { code: 'frontal', label: 'Frontal', sortOrder: 2 },
  { code: 'transverse', label: 'Transversal', sortOrder: 3 },
];

async function seedMovementPatterns() {
  for (const p of PATTERNS) {
    await prisma.movementPattern.upsert({
      where: { code: p.code },
      update: { label: p.label, sortOrder: p.sortOrder },
      create: p,
    });
  }
}

async function seedAnatomicalPlanes() {
  for (const p of PLANES) {
    await prisma.anatomicalPlane.upsert({
      where: { code: p.code },
      update: { label: p.label, sortOrder: p.sortOrder },
      create: p,
    });
  }
}

async function main() {
  console.log('Seeding biomechanical data...');
  await seedMovementPatterns();
  await seedAnatomicalPlanes();
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
