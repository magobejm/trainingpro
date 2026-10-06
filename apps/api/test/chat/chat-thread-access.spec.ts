import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { decideThreadAccess, type ThreadAccessSnapshot } from '../../src/modules/chat/domain/chat-thread-access';

const ORG = 'org-1';
const COACH_MEMBERSHIP = 'coach-membership-1';
const THREAD = 'thread-1';

const coach: AuthContext = {
  activeRole: 'coach',
  email: 'coach@fitcoach.local',
  roles: ['coach'],
  subject: 'coach-1',
};

const client: AuthContext = {
  activeRole: 'client',
  email: 'client@fitcoach.local',
  roles: ['client'],
  subject: 'client-1',
};

describe('decideThreadAccess', () => {
  it('allows the coach and the client who currently share the thread', () => {
    expect(decideThreadAccess(assignedThread(), coach)).toEqual({ senderRole: 'COACH', threadId: THREAD });
    expect(decideThreadAccess(assignedThread(), client)).toEqual({ senderRole: 'CLIENT', threadId: THREAD });
  });

  it('rejects another coach and another client', () => {
    expect(() => decideThreadAccess(assignedThread(), { ...coach, email: 'other@fitcoach.local' })).toThrow(
      ForbiddenException,
    );
    expect(() => decideThreadAccess(assignedThread(), { ...client, email: 'other@fitcoach.local' })).toThrow(
      'Chat thread access denied',
    );
  });

  it('rejects the previous coach and the client on a thread left behind after reassignment', () => {
    const reassigned = assignedThread();
    reassigned.client.coachMembershipId = 'coach-membership-2';
    expect(() => decideThreadAccess(reassigned, coach)).toThrow('Chat thread access denied');
    expect(() => decideThreadAccess(reassigned, client)).toThrow('Chat thread access denied');
  });

  it('rejects a thread whose organization does not match the client or the membership', () => {
    const otherClientOrg = assignedThread();
    otherClientOrg.client.organizationId = 'org-2';
    const otherMembershipOrg = assignedThread();
    otherMembershipOrg.coachMembership.organizationId = 'org-2';
    expect(() => decideThreadAccess(otherClientOrg, coach)).toThrow('Chat thread access denied');
    expect(() => decideThreadAccess(otherMembershipOrg, client)).toThrow('Chat thread access denied');
  });

  it('rejects an inactive or archived coach membership', () => {
    const inactive = assignedThread();
    inactive.coachMembership.isActive = false;
    const archived = assignedThread();
    archived.coachMembership.archivedAt = new Date('2026-01-01T00:00:00Z');
    expect(() => decideThreadAccess(inactive, coach)).toThrow('Chat thread access denied');
    expect(() => decideThreadAccess(archived, client)).toThrow('Chat thread access denied');
  });

  it('rejects an archived thread, a missing thread, and an admin', () => {
    const archived = assignedThread();
    archived.archivedAt = new Date('2026-01-01T00:00:00Z');
    const admin: AuthContext = { activeRole: 'admin', email: coach.email, roles: ['admin'], subject: 'admin-1' };
    expect(() => decideThreadAccess(archived, coach)).toThrow('Chat thread access denied');
    expect(() => decideThreadAccess(null, coach)).toThrow('Chat thread access denied');
    expect(() => decideThreadAccess(assignedThread(), admin)).toThrow('Chat thread access denied');
  });
});

function assignedThread(): ThreadAccessSnapshot {
  return {
    archivedAt: null,
    client: {
      archivedAt: null,
      coachMembershipId: COACH_MEMBERSHIP,
      email: 'client@fitcoach.local',
      organizationId: ORG,
    },
    coachMembership: {
      archivedAt: null,
      isActive: true,
      organizationId: ORG,
      role: 'COACH',
      user: { email: 'coach@fitcoach.local' },
    },
    coachMembershipId: COACH_MEMBERSHIP,
    id: THREAD,
    organizationId: ORG,
  };
}
