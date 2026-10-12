import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ManageCallProposalUseCase } from '../../src/modules/calls/application/use-cases/manage-call-proposal.usecase';
import { RespondCallProposalUseCase } from '../../src/modules/calls/application/use-cases/respond-call-proposal.usecase';
const coach = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'coach', email: 'coach@example.com' };
const client = { activeRole: 'client' as const, roles: ['client' as const], subject: 'client', email: 'client@example.com' };
function fixture(status = 'pending') {
  const proposal = {
    id: 'old',
    clientId: 'client',
    coachMembershipId: 'coach',
    threadId: 'thread',
    date: new Date('2026-10-20'),
    proposedTime: '09:00',
    initiatedBy: 'COACH',
    lastProposedBy: 'COACH',
    status,
    calendarEventId: status === 'accepted' ? 'event' : null,
    thread: {
      id: 'thread',
      organizationId: 'org',
      coachMembershipId: 'coach',
      archivedAt: null,
      client: { organizationId: 'org', coachMembershipId: 'coach', email: client.email, archivedAt: null },
      coachMembership: {
        organizationId: 'org',
        role: 'COACH',
        isActive: true,
        archivedAt: null,
        user: { email: coach.email },
      },
    },
  };
  const prisma = {
    callProposal: {
      findUnique: jest.fn(async () => proposal),
      updateMany: jest.fn(async (args) => {
        if (proposal.status !== args.where.status) return { count: 0 };
        Object.assign(proposal, args.data);
        return { count: 1 };
      }),
      create: jest.fn(async () => ({ id: 'new', threadId: 'thread' })),
      update: jest.fn(),
    },
    calendarEvent: { create: jest.fn(async () => ({ id: 'event' })), updateMany: jest.fn() },
    chatMessage: { create: jest.fn() },
    chatThread: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
  return { prisma, proposal };
}
describe('calendar call lifecycle', () => {
  it.each(['pending', 'accepted'])('preserves an unchanged %s invitation without notifying chat', async (status) => {
    const { prisma, proposal } = fixture(status);
    const result = await new ManageCallProposalUseCase(prisma as never).reschedule(coach, 'old', {
      date: '2026-10-20',
      time: '09:00',
    });
    expect(result.id).toBe('old');
    expect(proposal.status).toBe(status);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('cancels a pending call, notifies the chat, and rejects accepting the old card', async () => {
    const { prisma, proposal } = fixture();
    await new ManageCallProposalUseCase(prisma as never).cancel(coach, 'old');
    expect(proposal.status).toBe('cancelled');
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ callProposalId: 'old', text: expect.stringContaining('anulada') }),
      }),
    );
    await expect(new RespondCallProposalUseCase(prisma as never).accept(client, 'old')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.calendarEvent.create).not.toHaveBeenCalled();
  });
  it('replaces the call with a distinct pending proposal and a new chat card', async () => {
    const { prisma, proposal } = fixture();
    const result = await new ManageCallProposalUseCase(prisma as never).reschedule(coach, 'old', {
      date: '2026-10-22',
      time: '10:15',
    });
    expect(proposal.status).toBe('cancelled');
    expect(result.id).toBe('new');
    expect(prisma.callProposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          date: new Date('2026-10-22'),
          proposedTime: '10:15',
          lastProposedBy: 'COACH',
          messages: { create: expect.objectContaining({ senderRole: 'COACH', threadId: 'thread' }) },
        }),
      }),
    );
    await expect(new RespondCallProposalUseCase(prisma as never).accept(client, 'old')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('archives an accepted calendar event when replacing its convocatoria', async () => {
    const { prisma } = fixture('accepted');
    await new ManageCallProposalUseCase(prisma as never).reschedule(coach, 'old', { time: '11:00' });
    expect(prisma.calendarEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'event' }), data: { archivedAt: expect.any(Date) } }),
    );
  });
  it('rejects unauthorized participants before mutating anything', async () => {
    const { prisma } = fixture();
    await expect(
      new ManageCallProposalUseCase(prisma as never).cancel({ ...coach, email: 'other@example.com' }, 'old'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.callProposal.updateMany).not.toHaveBeenCalled();
  });
  it('does not create a replacement if another response has already changed the proposal', async () => {
    const { prisma } = fixture();
    prisma.callProposal.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      new ManageCallProposalUseCase(prisma as never).reschedule(coach, 'old', { time: '11:00' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.callProposal.create).not.toHaveBeenCalled();
  });
});
