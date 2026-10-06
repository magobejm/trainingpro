import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { decideThreadAccess, type ThreadAccessGrant } from '../../domain/chat-thread-access';

@Injectable()
export class ChatThreadAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAccess(context: AuthContext, threadId: string): Promise<ThreadAccessGrant> {
    const row = await this.prisma.chatThread.findFirst({
      where: { id: threadId },
      select: {
        archivedAt: true,
        client: {
          select: {
            archivedAt: true,
            coachMembershipId: true,
            email: true,
            organizationId: true,
          },
        },
        coachMembership: {
          select: {
            archivedAt: true,
            isActive: true,
            organizationId: true,
            role: true,
            user: { select: { email: true } },
          },
        },
        coachMembershipId: true,
        id: true,
        organizationId: true,
      },
    });
    return decideThreadAccess(row, context);
  }
}
