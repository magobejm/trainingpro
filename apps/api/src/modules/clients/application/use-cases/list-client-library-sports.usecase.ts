import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { buildLibraryScopeWhere, resolveClientCoachId } from '../client-library.helpers';
import { matchesSearch } from '../../../../common/text/normalize-search';

export type ClientLibrarySport = {
  description: null | string;
  icon: string;
  id: string;
  mediaUrl: null | string;
  name: string;
  scope: string;
};

@Injectable()
export class ListClientLibrarySportsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, q?: string): Promise<ClientLibrarySport[]> {
    const coachId = await resolveClientCoachId(this.prisma, context);
    const rows = await this.prisma.sport.findMany({
      where: { ...buildLibraryScopeWhere(coachId) },
      select: {
        description: true,
        icon: true,
        id: true,
        mediaUrl: true,
        name: true,
        scope: true,
      },
      orderBy: [{ name: 'asc' }],
    });
    return rows
      .map((r) => ({
        description: r.description,
        icon: r.icon,
        id: r.id,
        mediaUrl: r.mediaUrl,
        name: r.name,
        scope: r.scope,
      }))
      .filter((r) => matchesSearch(r.name, q));
  }
}
