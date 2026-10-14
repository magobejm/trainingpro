import type { PrismaService } from '../../../common/prisma/prisma.service';

type StrengthUpdate = {
  anatomicalPlaneId?: string;
  coachInstructions?: string;
  equipmentId?: string;
  instructions?: string;
  movementPatternId?: string;
  muscleGroupIds?: string[];
};

export function updateStrengthExercise(
  prisma: PrismaService,
  id: string,
  base: Record<string, unknown>,
  dto: StrengthUpdate,
) {
  return prisma.exerciseMuscleGroupAssignment.deleteMany({ where: { exerciseId: id } }).then(() =>
    prisma.exercise.update({
      where: { id },
      data: {
        ...base,
        equipmentId: dto.equipmentId,
        movementPatternId: dto.movementPatternId,
        anatomicalPlaneId: dto.anatomicalPlaneId,
        instructions: dto.instructions,
        coachInstructions: dto.coachInstructions,
        muscleGroups: { create: (dto.muscleGroupIds ?? []).map((muscleGroupId) => ({ muscleGroupId })) },
      },
    }),
  );
}
