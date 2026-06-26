import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { buildLibraryScopeWhere, resolveClientCoachId } from '../client-library.helpers';
import { matchesSearch } from '../../../../common/text/normalize-search';

export type ClientLibraryCardio = {
  description: null | string;
  equipment: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  methodType: null | string;
  name: string;
  scope: string;
  youtubeUrl: null | string;
};

@Injectable()
export class ListClientLibraryCardioUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, q?: string): Promise<ClientLibraryCardio[]> {
    const coachId = await resolveClientCoachId(this.prisma, context);
    const rows = await this.prisma.cardioMethod.findMany({
      where: { ...buildLibraryScopeWhere(coachId) },
      select: {
        description: true,
        equipment: true,
        id: true,
        mediaType: true,
        mediaUrl: true,
        methodTypeRef: { select: { label: true } },
        name: true,
        scope: true,
        youtubeUrl: true,
      },
      orderBy: [{ name: 'asc' }],
    });
    return rows
      .map((r) => ({
        description: r.description,
        equipment: r.equipment,
        id: r.id,
        mediaType: r.mediaType,
        mediaUrl: r.mediaUrl,
        methodType: r.methodTypeRef?.label ?? null,
        name: r.name,
        scope: r.scope,
        youtubeUrl: r.youtubeUrl,
      }))
      .filter((r) => matchesSearch(r.name, q));
  }
}
