import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthContext } from '../../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../../common/prisma/prisma.service';

export type CoachMembership = {
  id: string;
  organizationId: string;
};

@Injectable()
export class PlansBaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  protected async resolveCoachMembership(context: AuthContext): Promise<CoachMembership> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: context.subject },
      },
      select: { id: true, organizationId: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }
}
