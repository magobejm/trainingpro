import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { buildLibraryScopeWhere, resolveClientCoachId } from '../client-library.helpers';
import { matchesSearch } from '../../../../common/text/normalize-search';

export type ClientLibraryPlio = {
  description: null | string;
  equipment: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  name: string;
  notes: null | string;
  plioType: null | string;
  scope: string;
  youtubeUrl: null | string;
};

@Injectable()
export class ListClientLibraryPlioUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, q?: string): Promise<ClientLibraryPlio[]> {
    const coachId = await resolveClientCoachId(this.prisma, context);
    const rows = await this.prisma.plioExercise.findMany({
      where: { ...buildLibraryScopeWhere(coachId) },
      select: {
        description: true,
        equipment: true,
        id: true,
        mediaType: true,
        mediaUrl: true,
        name: true,
        notes: true,
        plioType: true,
        scope: true,
        youtubeUrl: true,
      },
      orderBy: [{ name: 'asc' }],
    });
    return rows
      .map((r) => ({
        description: r.description,
        equipment: r.equipment ?? null,
        id: r.id,
        mediaType: r.mediaType,
        mediaUrl: r.mediaUrl,
        name: r.name,
        notes: r.notes,
        plioType: r.plioType ?? null,
        scope: r.scope,
        youtubeUrl: r.youtubeUrl,
      }))
      .filter((r) => matchesSearch(r.name, q));
  }
}
