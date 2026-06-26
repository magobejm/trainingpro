import { NotFoundException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { PrismaService } from '../../../common/prisma/prisma.service';

export function buildLibraryScopeWhere(coachMembershipId: string) {
  return {
    OR: [{ scope: LibraryItemScope.GLOBAL }, { coachMembershipId, scope: LibraryItemScope.COACH }],
    archivedAt: null,
  };
}

export async function resolveClientCoachId(prisma: PrismaService, context: AuthContext): Promise<string> {
  const email = context.email;
  if (!email) throw new NotFoundException('Client profile not found');
  const client = await prisma.client.findFirst({
    where: { archivedAt: null, email },
    select: { coachMembershipId: true },
  });
  if (!client) throw new NotFoundException('Client profile not found');
  const coachId = client.coachMembershipId;
  if (!coachId) throw new NotFoundException('No coach assigned to this client');
  return coachId;
}
