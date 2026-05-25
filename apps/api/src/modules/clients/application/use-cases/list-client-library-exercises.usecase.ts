import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { buildLibraryScopeWhere, containsFilter, resolveClientCoachId } from '../client-library.helpers';

export type ClientLibraryExercise = {
  equipment: null | string;
  id: string;
  instructions: null | string;
  mediaType: null | string;
  mediaUrl: null | string;
  muscleGroups: Array<{ id: string; label: string }>;
  name: string;
  scope: string;
  youtubeUrl: null | string;
};

@Injectable()
export class ListClientLibraryExercisesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, q?: string): Promise<ClientLibraryExercise[]> {
    const coachId = await resolveClientCoachId(this.prisma, context);
    const rows = await this.prisma.exercise.findMany({
      where: { ...buildLibraryScopeWhere(coachId), name: containsFilter(q) },
      select: {
        equipment: true,
        id: true,
        instructions: true,
        mediaType: true,
        mediaUrl: true,
        muscleGroups: { select: { muscleGroup: { select: { id: true, label: true } } } },
        name: true,
        scope: true,
        youtubeUrl: true,
      },
      orderBy: [{ name: 'asc' }],
    });
    return rows.map((r) => ({
      equipment: r.equipment,
      id: r.id,
      instructions: r.instructions,
      mediaType: r.mediaType,
      mediaUrl: r.mediaUrl,
      muscleGroups: r.muscleGroups.map((mg) => ({ id: mg.muscleGroup.id, label: mg.muscleGroup.label })),
      name: r.name,
      scope: r.scope,
      youtubeUrl: r.youtubeUrl,
    }));
  }
}
