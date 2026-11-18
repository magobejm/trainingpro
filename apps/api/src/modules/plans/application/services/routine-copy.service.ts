import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Role, TemplateKind } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { cloneTemplateForCoach } from '../../infra/prisma/client-routine-clone';

const TX_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

@Injectable()
export class RoutineCopyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Copies a visible routine (global or own) into a new library routine owned by the coach. */
  async copy(context: AuthContext, templateId: string, name: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: context.subject } },
      select: { id: true, organizationId: true },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    const source = await this.prisma.planTemplate.findFirst({
      where: {
        id: templateId,
        archivedAt: null,
        kind: TemplateKind.ROUTINE,
        ownerClientId: null,
        OR: [{ coachMembershipId: membership.id }, { scope: LibraryItemScope.GLOBAL }],
      },
      select: { id: true },
    });
    if (!source) throw new NotFoundException('Routine template not found');
    const id = await this.prisma.$transaction(
      (tx) =>
        cloneTemplateForCoach(tx, {
          sourceTemplateId: source.id,
          actorId: context.subject,
          coachMembershipId: membership.id,
          organizationId: membership.organizationId,
          name,
        }),
      TX_OPTIONS,
    );
    return { id, name };
  }
}
