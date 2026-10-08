import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateCallProposalUseCase } from '../../src/modules/calls/application/use-cases/create-call-proposal.usecase';
import { RespondCallProposalUseCase } from '../../src/modules/calls/application/use-cases/respond-call-proposal.usecase';

const CLIENT = '11111111-1111-1111-1111-111111111111';
const COACH = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'coach-uid' };
const CLIENT_AUTH = {
  activeRole: 'client' as const,
  email: 'client5@example.com',
  roles: ['client' as const],
  subject: 'client-uid',
};

function threadRow() {
  return {
    archivedAt: null,
    client: {
      archivedAt: null,
      coachMembershipId: 'membership-1',
      email: 'client5@example.com',
      organizationId: 'org-1',
    },
    coachMembership: {
      archivedAt: null,
      isActive: true,
      organizationId: 'org-1',
      role: 'COACH',
      user: { email: 'coach@example.com' },
    },
    coachMembershipId: 'membership-1',
    id: 'thread-1',
    organizationId: 'org-1',
  };
}

describe('CreateCallProposalUseCase', () => {
  const prisma = {
    organizationMember: { findFirst: jest.fn() },
    client: { findFirst: jest.fn() },
    chatThread: { upsert: jest.fn(), update: jest.fn() },
    callProposal: { create: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: 'membership-1', organizationId: 'org-1' });
    prisma.client.findFirst.mockResolvedValue({ id: CLIENT });
    prisma.chatThread.upsert.mockResolvedValue({ id: 'thread-1' });
    prisma.chatThread.update.mockResolvedValue({});
    prisma.callProposal.create.mockResolvedValue({ id: 'proposal-1' });
  });

  it('creates a pending proposal with a chat card from the coach', async () => {
    const result = await new CreateCallProposalUseCase(prisma as never).execute(COACH, {
      clientId: CLIENT,
      date: '2026-10-20',
      time: '17:15',
    });

    expect(result).toEqual({ id: 'proposal-1', threadId: 'thread-1' });
    const created = prisma.callProposal.create.mock.calls[0][0].data;
    expect(created).toMatchObject({
      clientId: CLIENT,
      initiatedBy: 'COACH',
      lastProposedBy: 'COACH',
      proposedTime: '17:15',
      threadId: 'thread-1',
      messages: { create: expect.objectContaining({ senderRole: 'COACH', threadId: 'thread-1' }) },
    });
  });

  it('rejects a time outside the allowed quarters', async () => {
    await expect(
      new CreateCallProposalUseCase(prisma as never).execute(COACH, {
        clientId: CLIENT,
        date: '2026-10-20',
        time: '07:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.callProposal.create).not.toHaveBeenCalled();
  });
});

describe('RespondCallProposalUseCase', () => {
  const prisma = {
    callProposal: { findUnique: jest.fn(), update: jest.fn() },
    calendarEvent: { create: jest.fn() },
    chatMessage: { create: jest.fn() },
    chatThread: { update: jest.fn() },
  };
  const pending = {
    clientId: CLIENT,
    coachMembershipId: 'membership-1',
    date: new Date('2026-10-20T00:00:00.000Z'),
    id: 'proposal-1',
    lastProposedBy: 'COACH',
    proposedTime: '17:15',
    status: 'pending',
    thread: threadRow(),
    threadId: 'thread-1',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.callProposal.findUnique.mockResolvedValue(pending);
    prisma.callProposal.update.mockResolvedValue({});
    prisma.calendarEvent.create.mockResolvedValue({ id: 'event-1' });
    prisma.chatMessage.create.mockResolvedValue({});
    prisma.chatThread.update.mockResolvedValue({});
  });

  it('accepting creates a call event and links it to the proposal', async () => {
    const result = await new RespondCallProposalUseCase(prisma as never).accept(CLIENT_AUTH, 'proposal-1');

    expect(result).toEqual({ calendarEventId: 'event-1', status: 'accepted' });
    expect(prisma.calendarEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientId: CLIENT, time: '17:15', type: 'call' }),
      }),
    );
    expect(prisma.callProposal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { calendarEventId: 'event-1', status: 'accepted' } }),
    );
  });

  it('does not let the proposer accept their own proposal', async () => {
    await expect(new RespondCallProposalUseCase(prisma as never).accept(COACH, 'proposal-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.calendarEvent.create).not.toHaveBeenCalled();
  });

  it('does not accept a proposal that is no longer pending', async () => {
    prisma.callProposal.findUnique.mockResolvedValue({ ...pending, status: 'accepted' });
    await expect(new RespondCallProposalUseCase(prisma as never).accept(CLIENT_AUTH, 'proposal-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('counter changes the time and the last proposer', async () => {
    const result = await new RespondCallProposalUseCase(prisma as never).counter(CLIENT_AUTH, 'proposal-1', '18:00');

    expect(result).toEqual({ proposedTime: '18:00', status: 'pending' });
    expect(prisma.callProposal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lastProposedBy: 'CLIENT', proposedTime: '18:00' } }),
    );
    expect(prisma.calendarEvent.create).not.toHaveBeenCalled();
  });
});
