import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../../common/auth-context/auth-context';

const ACCESS_DENIED = 'Chat thread access denied';

export type ThreadAccessSnapshot = {
  archivedAt: Date | null;
  client: {
    archivedAt: Date | null;
    coachMembershipId: string;
    email: string;
    organizationId: string;
  };
  coachMembership: {
    archivedAt: Date | null;
    isActive: boolean;
    organizationId: string;
    role: string;
    user: { email: string };
  };
  coachMembershipId: string;
  id: string;
  organizationId: string;
};

export type ThreadAccessGrant = {
  senderRole: 'CLIENT' | 'COACH';
  threadId: string;
};

/** Allows the request only when the caller still belongs to this thread's current coach, client, and organization. */
export function decideThreadAccess(row: ThreadAccessSnapshot | null, context: AuthContext): ThreadAccessGrant {
  if (!row || !isCurrentAssignment(row)) {
    throw new ForbiddenException(ACCESS_DENIED);
  }
  if (context.activeRole === 'coach' && sameEmail(row.coachMembership.user.email, context.email)) {
    return { senderRole: 'COACH', threadId: row.id };
  }
  if (context.activeRole === 'client' && row.client.archivedAt === null && sameEmail(row.client.email, context.email)) {
    return { senderRole: 'CLIENT', threadId: row.id };
  }
  throw new ForbiddenException(ACCESS_DENIED);
}

function isCurrentAssignment(row: ThreadAccessSnapshot): boolean {
  return (
    row.archivedAt === null &&
    row.organizationId === row.client.organizationId &&
    row.organizationId === row.coachMembership.organizationId &&
    row.client.coachMembershipId === row.coachMembershipId &&
    row.coachMembership.isActive &&
    row.coachMembership.archivedAt === null &&
    row.coachMembership.role === 'COACH'
  );
}

function sameEmail(stored: string, given: string | undefined): boolean {
  return stored === (given ?? '');
}
