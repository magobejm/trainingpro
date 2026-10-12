import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { decideThreadAccess } from '../../../chat/domain/chat-thread-access';
import { isValidCallTime } from '../../domain/call-proposal';
import { CALL_THREAD_INCLUDE, cancelCallProposal, replaceCallProposal } from './call-proposal.persistence';
@Injectable()
export class ManageCallProposalUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async cancel(context: AuthContext, proposalId: string) {
    const { proposal, party } = await this.load(context, proposalId);
    await this.prisma.$transaction((tx) => cancelCallProposal(tx, context, proposal, party));
    return { status: 'cancelled' as const };
  }
  async reschedule(context: AuthContext, proposalId: string, input: { date?: string; time?: string }) {
    if (input.time !== undefined && !isValidCallTime(input.time))
      throw new BadRequestException('Call time must be a quarter hour between 08:00 and 21:45');
    if (input.date !== undefined && !Number.isFinite(Date.parse(input.date)))
      throw new BadRequestException('Invalid call date');
    const { proposal, party } = await this.load(context, proposalId);
    const date = input.date ? new Date(input.date) : proposal.date;
    const time = input.time ?? proposal.proposedTime;
    if (date.getTime() === proposal.date.getTime() && time === proposal.proposedTime) return proposal;
    return this.prisma.$transaction((tx) => replaceCallProposal(tx, context, proposal, party, input));
  }
  private async load(context: AuthContext, proposalId: string) {
    const proposal = await this.prisma.callProposal.findUnique({
      where: { id: proposalId },
      include: { thread: { include: CALL_THREAD_INCLUDE } },
    });
    if (!proposal) throw new NotFoundException('Call proposal not found');
    const { senderRole: party } = decideThreadAccess(proposal.thread, context);
    if (proposal.status === 'cancelled') throw new ConflictException('Call proposal is no longer active');
    return { proposal, party };
  }
}
