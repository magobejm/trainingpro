import { CoachOnboardingService } from '../../src/modules/coaches/application/coach-onboarding.service';
import type { PrismaService } from '../../src/common/prisma/prisma.service';

const context = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'uid-1' };
function setup() {
  const member = { id: 'coach-1', organizationId: 'org-1', onboardingHidden: false };
  const prisma = {
    organizationMember: { findFirst: jest.fn().mockResolvedValue(member), update: jest.fn().mockResolvedValue(member) },
    client: { findFirst: jest.fn().mockResolvedValue({ id: 'client-1' }) },
    planTemplate: { findFirst: jest.fn().mockResolvedValue(null) },
    chatMessage: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  return { prisma, service: new CoachOnboardingService(prisma as unknown as PrismaService) };
}

describe('coach onboarding', () => {
  it('rejects other active roles and missing active memberships', async () => {
    const { prisma, service } = setup();
    await expect(service.get({ ...context, activeRole: 'client' })).rejects.toThrow();
    expect(prisma.organizationMember.findFirst).not.toHaveBeenCalled();
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    await expect(service.get(context)).rejects.toThrow();
  });
  it('computes steps from active own resources and the actual coach sender', async () => {
    const { prisma, service } = setup();
    const result = await service.get(context);
    expect(result).toEqual({ hidden: false, steps: { client: true, routine: false, assignment: true, message: false } });
    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'COACH', isActive: true, archivedAt: null, user: { supabaseUid: 'uid-1' } },
      }),
    );
    expect(prisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ coachMembershipId: 'coach-1', organizationId: 'org-1', archivedAt: null }),
      }),
    );
    expect(prisma.planTemplate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ coachMembershipId: 'coach-1', archivedAt: null, scope: 'COACH' }),
      }),
    );
    expect(prisma.chatMessage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          senderRole: 'COACH',
          senderSubject: 'uid-1',
          thread: {
            coachMembershipId: 'coach-1',
            organizationId: 'org-1',
            archivedAt: null,
            client: { coachMembershipId: 'coach-1', archivedAt: null },
          },
        },
      }),
    );
    expect(prisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trainingPlan: {
            archivedAt: null,
            OR: [{ coachMembershipId: 'coach-1' }, { scope: 'GLOBAL', coachMembershipId: null }],
          },
          trainingPlanId: { not: null },
        }),
      }),
    );
  });
  it('isolates progress and visibility between coach memberships without writing on GET', async () => {
    const { prisma, service } = setup();
    prisma.organizationMember.findFirst.mockImplementation(({ where }) =>
      Promise.resolve({
        id: where.user.supabaseUid,
        organizationId: 'org-1',
        onboardingHidden: where.user.supabaseUid === 'uid-2',
      }),
    );
    prisma.client.findFirst.mockImplementation(({ where }) =>
      Promise.resolve(where.coachMembershipId === 'uid-1' ? { id: 'client-1' } : null),
    );
    expect((await service.get(context)).steps.client).toBe(true);
    const other = await service.get({ ...context, subject: 'uid-2' });
    expect(other.steps.client).toBe(false);
    expect(other.hidden).toBe(true);
    expect(prisma.organizationMember.update).not.toHaveBeenCalled();
  });
  it('allows only hidden boolean and updates the authenticated membership', async () => {
    const { prisma, service } = setup();
    for (const body of [{}, { hidden: 'true' }, { hidden: false, steps: { client: true } }]) {
      await expect(service.patch(context, body)).rejects.toThrow();
    }
    expect(prisma.organizationMember.update).not.toHaveBeenCalled();
    await service.patch(context, { hidden: true });
    expect(prisma.organizationMember.update).toHaveBeenCalledWith({
      where: { id: 'coach-1' },
      data: { onboardingHidden: true },
    });
  });
});
