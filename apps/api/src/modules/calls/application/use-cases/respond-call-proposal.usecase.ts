import { CALL_THREAD_INCLUDE, claimCallProposal, postCallMessage, replaceCallProposal } from './call-proposal.persistence';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { decideThreadAccess } from '../../../chat/domain/chat-thread-access';
import { canRespondToProposal, isValidCallTime } from '../../domain/call-proposal';

@Injectable()
export class RespondCallProposalUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async accept(context: AuthContext, proposalId: string) {
    const { party, proposal } = await this.loadRespondable(context, proposalId);
    return this.prisma.$transaction(async (tx) => {
      await claimCallProposal(tx, proposal, 'accepted');
      const event = await tx.calendarEvent.create({
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
      await tx.callProposal.update({ where: { id: proposal.id }, data: { calendarEventId: event.id } });
      await postCallMessage(tx, context, proposal, party, 'Llamada agendada para las ' + proposal.proposedTime + 'h');
      return { calendarEventId: event.id, status: 'accepted' as const };
    });
  }

  async counter(context: AuthContext, proposalId: string, time: string) {
    if (!isValidCallTime(time)) {
      throw new BadRequestException('Call time must be a quarter hour between 08:00 and 21:45');
    }
    const { party, proposal } = await this.loadRespondable(context, proposalId);
    const replacement = await this.prisma.$transaction((tx) => replaceCallProposal(tx, context, proposal, party, { time }));
    return { id: replacement.id, proposedTime: time, status: 'pending' as const };
  }

  private async loadRespondable(context: AuthContext, proposalId: string) {
    const proposal = await this.prisma.callProposal.findUnique({
      where: { id: proposalId },
      include: { thread: { include: CALL_THREAD_INCLUDE } },
    });
    if (!proposal) throw new NotFoundException('Call proposal not found');
    if (proposal.status !== 'pending') throw new ConflictException('Call proposal is no longer pending');
    const grant = decideThreadAccess(proposal.thread, context);
    const party = grant.senderRole;
    if (!canRespondToProposal(party, proposal.lastProposedBy)) {
      throw new ForbiddenException('Only the other party can respond to a call proposal');
    }
    return { party, proposal };
  }
}
