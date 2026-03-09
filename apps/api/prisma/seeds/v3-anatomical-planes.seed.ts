import type { PrismaClient } from '@prisma/client';

export const ANATOMICAL_PLANES_V3 = [
  { code: 'undefined', label: 'Sin definir', sortOrder: 0, isDefault: true },
  { code: 'sagittal', label: 'Sagital', sortOrder: 10, isDefault: false },
  { code: 'frontal', label: 'Frontal', sortOrder: 20, isDefault: false },
  { code: 'transverse', label: 'Transversal', sortOrder: 30, isDefault: false },
];

export async function seedAnatomicalPlanes(prisma: PrismaClient) {
  for (const plane of ANATOMICAL_PLANES_V3) {
    await prisma.anatomicalPlane.upsert({
      where: { code: plane.code },
      update: {
        label: plane.label,
        sortOrder: plane.sortOrder,
        isDefault: plane.isDefault,
      },
      create: {
        code: plane.code,
        label: plane.label,
        sortOrder: plane.sortOrder,
        isDefault: plane.isDefault,
      },
    });
  }
}
