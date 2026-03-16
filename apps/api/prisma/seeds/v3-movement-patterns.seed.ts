import type { PrismaClient } from '@prisma/client';

export const MOVEMENT_PATTERNS_V3 = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'horizontal_push', label: 'Empuje horizontal', sortOrder: 10, isDefault: false },
  { code: 'vertical_push', label: 'Empuje vertical', sortOrder: 20, isDefault: false },
  { code: 'horizontal_pull', label: 'Traccion horizontal', sortOrder: 30, isDefault: false },
  { code: 'vertical_pull', label: 'Traccion vertical', sortOrder: 40, isDefault: false },
  { code: 'knee_dominant', label: 'Dominante de rodilla', sortOrder: 50, isDefault: false },
  { code: 'hip_hinge', label: 'Bisagra de cadera', sortOrder: 60, isDefault: false },
  { code: 'hip_thrust', label: 'Empuje de cadera', sortOrder: 70, isDefault: false },
  { code: 'hip_extension', label: 'Extension de cadera', sortOrder: 75, isDefault: false },
  { code: 'hip_flexion', label: 'Flexion de cadera', sortOrder: 77, isDefault: false },
  { code: 'rotation_anti_rotation', label: 'Rotacion/Anti-rotacion', sortOrder: 80, isDefault: false },
  { code: 'stabilization', label: 'Estabilizacion', sortOrder: 90, isDefault: false },
  { code: 'locomotion_carry', label: 'Locomocion y transporte', sortOrder: 100, isDefault: false },
  { code: 'elbow_flexion', label: 'Flexion de codo', sortOrder: 110, isDefault: false },
  { code: 'elbow_extension', label: 'Extension de codo', sortOrder: 120, isDefault: false },
  { code: 'shoulder_abduction', label: 'Abduccion de hombro', sortOrder: 130, isDefault: false },
  { code: 'shoulder_adduction', label: 'Aduccion de hombro', sortOrder: 140, isDefault: false },
  { code: 'hip_abduction', label: 'Abduccion de cadera', sortOrder: 150, isDefault: false },
  { code: 'hip_adduction', label: 'Aduccion de cadera', sortOrder: 160, isDefault: false },
  { code: 'ankle_flexion_extension', label: 'Flexo/Extension de tobillo', sortOrder: 170, isDefault: false },
  { code: 'plantar_flexion', label: 'Flexion plantar', sortOrder: 175, isDefault: false },
  { code: 'finger_flexion', label: 'Flexion de los dedos', sortOrder: 180, isDefault: false },
];

export async function seedMovementPatterns(prisma: PrismaClient) {
  for (const pattern of MOVEMENT_PATTERNS_V3) {
    await prisma.movementPattern.upsert({
      where: { code: pattern.code },
      update: { label: pattern.label, sortOrder: pattern.sortOrder, isDefault: pattern.isDefault },
      create: { code: pattern.code, label: pattern.label, sortOrder: pattern.sortOrder, isDefault: pattern.isDefault },
    });
  }
}
