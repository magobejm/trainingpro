import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { buildLibraryScopeWhere, resolveClientCoachId } from '../client-library.helpers';
import { matchesSearch } from '../../../../common/text/normalize-search';

export type ClientLibraryMobility = {
  description: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  mobilityType: null | string;
  name: string;
  scope: string;
  youtubeUrl: null | string;
};

@Injectable()
export class ListClientLibraryMobilityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, q?: string): Promise<ClientLibraryMobility[]> {
    const coachId = await resolveClientCoachId(this.prisma, context);
    const rows = await this.prisma.mobilityExercise.findMany({
      where: { ...buildLibraryScopeWhere(coachId) },
      select: {
        description: true,
        id: true,
        mediaType: true,
        mediaUrl: true,
        mobilityType: true,
        name: true,
        scope: true,
        youtubeUrl: true,
      },
      orderBy: [{ name: 'asc' }],
    });
    return rows
      .map((r) => ({
        description: r.description,
        id: r.id,
        mediaType: r.mediaType,
        mediaUrl: r.mediaUrl,
        mobilityType: r.mobilityType ?? null,
        name: r.name,
        scope: r.scope,
        youtubeUrl: r.youtubeUrl,
      }))
      .filter((r) => matchesSearch(r.name, q));
  }
}
