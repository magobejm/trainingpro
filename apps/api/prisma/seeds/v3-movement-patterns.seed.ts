import type { PrismaClient } from '@prisma/client';

export const MOVEMENT_PATTERNS_V3 = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'horizontal_push', label: 'Empuje horizontal', sortOrder: 10, isDefault: false },
  { code: 'vertical_push', label: 'Empuje vertical', sortOrder: 20, isDefault: false },
  { code: 'horizontal_pull', label: 'Tracción horizontal', sortOrder: 30, isDefault: false },
  { code: 'vertical_pull', label: 'Tracción vertical', sortOrder: 40, isDefault: false },
  { code: 'knee_dominant', label: 'Dominante de rodilla', sortOrder: 50, isDefault: false },
  { code: 'hip_hinge', label: 'Bisagra de cadera', sortOrder: 60, isDefault: false },
  { code: 'hip_thrust', label: 'Empuje de cadera', sortOrder: 70, isDefault: false },
  { code: 'rotation_anti_rotation', label: 'Rotación/Anti-rotación', sortOrder: 80, isDefault: false },
  { code: 'stabilization', label: 'Estabilización', sortOrder: 90, isDefault: false },
  { code: 'locomotion_carry', label: 'Locomoción y transporte', sortOrder: 100, isDefault: false },
  { code: 'elbow_flexion', label: 'Flexión de codo', sortOrder: 110, isDefault: false },
  { code: 'elbow_extension', label: 'Extensión de codo', sortOrder: 120, isDefault: false },
  { code: 'shoulder_abduction', label: 'Abducción de hombro', sortOrder: 130, isDefault: false },
  { code: 'shoulder_adduction', label: 'Aducción de hombro', sortOrder: 140, isDefault: false },
  { code: 'hip_abduction', label: 'Abducción de cadera', sortOrder: 150, isDefault: false },
  { code: 'hip_adduction', label: 'Aducción de cadera', sortOrder: 160, isDefault: false },
  { code: 'ankle_flexion_extension', label: 'Flexo/Extensión de tobillo', sortOrder: 170, isDefault: false },
];

export async function seedMovementPatterns(prisma: PrismaClient) {
  for (const pattern of MOVEMENT_PATTERNS_V3) {
    await prisma.movementPattern.upsert({
      where: { code: pattern.code },
      update: {
        label: pattern.label,
        sortOrder: pattern.sortOrder,
        isDefault: pattern.isDefault,
      },
      create: {
        code: pattern.code,
        label: pattern.label,
        sortOrder: pattern.sortOrder,
        isDefault: pattern.isDefault,
      },
    });
  }
}
