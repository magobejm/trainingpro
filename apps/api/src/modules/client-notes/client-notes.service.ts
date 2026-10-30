import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ClientNoteView = {
  category: 'EXERCISE' | 'OTHER';
  clientId: string;
  createdAt: Date;
  exerciseLibraryId: null | string;
  exerciseName: null | string;
  id: string;
  sessionId: null | string;
  sessionItemId: null | string;
  text: string;
};

export type CreateClientNoteInput = {
  category: 'EXERCISE' | 'OTHER';
  exerciseLibraryId?: null | string;
  exerciseName?: null | string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  text: string;
};

const SELECT = {
  category: true,
  clientId: true,
  createdAt: true,
  exerciseLibraryId: true,
  exerciseName: true,
  id: true,
  sessionId: true,
  sessionItemId: true,
  text: true,
} as const;

/** Notes the client writes about an exercise or anything else. The coach can only read them. */
@Injectable()
export class ClientNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(context: AuthContext, input: CreateClientNoteInput): Promise<ClientNoteView> {
    if (context.activeRole !== 'client') throw new ForbiddenException('Only clients can write notes');
    const client = await this.prisma.client.findFirst({
      select: { coachMembershipId: true, id: true, organizationId: true },
      where: { archivedAt: null, email: context.email ?? '' },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    await this.assertOwnSession(client.id, input.sessionId, input.sessionItemId);
    return this.prisma.clientNote.create({
      data: {
        category: input.category,
        clientId: client.id,
        coachMembershipId: client.coachMembershipId,
        createdBy: context.subject,
        exerciseLibraryId: input.exerciseLibraryId ?? null,
        exerciseName: input.exerciseName ?? null,
        organizationId: client.organizationId,
        sessionId: input.sessionId ?? null,
        sessionItemId: input.sessionItemId ?? null,
        text: input.text,
      },
      select: SELECT,
    });
  }

  async list(context: AuthContext, query: { category?: 'EXERCISE' | 'OTHER'; clientId: string }): Promise<ClientNoteView[]> {
    if (context.activeRole !== 'coach') throw new ForbiddenException('Only coaches can read client notes');
    const membership = await this.prisma.organizationMember.findFirst({
      select: { id: true },
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: context.subject } },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    return this.prisma.clientNote.findMany({
      orderBy: { createdAt: 'desc' },
      select: SELECT,
      where: {
        archivedAt: null,
        category: query.category,
        client: { archivedAt: null, coachMembershipId: membership.id },
        clientId: query.clientId,
      },
    });
  }

  private async assertOwnSession(clientId: string, sessionId?: null | string, sessionItemId?: null | string) {
    if (sessionId) {
      const session = await this.prisma.sessionInstance.findFirst({
        select: { id: true },
        where: { archivedAt: null, clientId, id: sessionId },
      });
      if (!session) throw new NotFoundException('Session not found');
    }
    if (sessionItemId) {
      const item = await this.prisma.sessionStrengthItem.findFirst({
        select: { id: true },
        where: { id: sessionItemId, session: { clientId } },
      });
      if (!item) throw new NotFoundException('Session item not found');
    }
  }
}
