import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { CHAT_RETENTION_DAYS } from '../../../chat/domain/chat.constants';
import { decideThreadAccess } from '../../../chat/domain/chat-thread-access';
import type { CallParty } from '../../domain/call-proposal';
import { canRespondToProposal, isValidCallTime } from '../../domain/call-proposal';

const THREAD_INCLUDE = {
  client: { select: { archivedAt: true, coachMembershipId: true, email: true, organizationId: true } },
  coachMembership: {
    select: { archivedAt: true, isActive: true, organizationId: true, role: true, user: { select: { email: true } } },
  },
} as const;

@Injectable()
export class RespondCallProposalUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async accept(context: AuthContext, proposalId: string) {
    const { party, proposal } = await this.loadRespondable(context, proposalId);
    const event = await this.prisma.calendarEvent.create({
      data: {
        clientId: proposal.clientId,
        coachMembershipId: proposal.coachMembershipId,
        date: proposal.date,
        time: proposal.proposedTime,
        title: 'Llamada',
        type: 'call',
      },
      select: { id: true },
    });
    await this.prisma.callProposal.update({
      where: { id: proposal.id },
      data: { calendarEventId: event.id, status: 'accepted' },
    });
    await this.postMessage(context, proposal, party, `Llamada agendada para las ${proposal.proposedTime}h`);
    return { calendarEventId: event.id, status: 'accepted' as const };
  }

  async counter(context: AuthContext, proposalId: string, time: string) {
    if (!isValidCallTime(time)) {
      throw new BadRequestException('Call time must be a quarter hour between 08:00 and 21:45');
    }
    const { party, proposal } = await this.loadRespondable(context, proposalId);
    await this.prisma.callProposal.update({
      where: { id: proposal.id },
      data: { lastProposedBy: party, proposedTime: time },
    });
    const who = party === 'COACH' ? 'El entrenador' : 'El cliente';
    await this.postMessage(context, proposal, party, `${who} solicita cambiar la hora a las ${time}h`);
    return { proposedTime: time, status: 'pending' as const };
  }

  private async loadRespondable(context: AuthContext, proposalId: string) {
    const proposal = await this.prisma.callProposal.findUnique({
      where: { id: proposalId },
      include: { thread: { include: THREAD_INCLUDE } },
    });
    if (!proposal) throw new NotFoundException('Call proposal not found');
    if (proposal.status !== 'pending') throw new ConflictException('Call proposal is no longer pending');
    const grant = decideThreadAccess(proposal.thread, context);
    const party = grant.senderRole as CallParty;
    if (!canRespondToProposal(party, proposal.lastProposedBy)) {
      throw new ForbiddenException('Only the other party can respond to a call proposal');
    }
    return { party, proposal };
  }

  private async postMessage(
    context: AuthContext,
    proposal: { id: string; threadId: string },
    party: CallParty,
    text: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + CHAT_RETENTION_DAYS);
    await this.prisma.chatMessage.create({
      data: {
        callProposalId: proposal.id,
        expiresAt,
        senderRole: party,
        senderSubject: context.subject,
        text,
        threadId: proposal.threadId,
      },
    });
    await this.prisma.chatThread.update({ where: { id: proposal.threadId }, data: { updatedAt: new Date() } });
  }
}
