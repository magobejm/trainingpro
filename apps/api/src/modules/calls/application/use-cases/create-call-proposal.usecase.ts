import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { CHAT_RETENTION_DAYS } from '../../../chat/domain/chat.constants';
import type { CallParty } from '../../domain/call-proposal';
import { isValidCallTime } from '../../domain/call-proposal';

export type CreateCallProposalInput = {
  clientId?: string;
  date: string;
  time: string;
};

type Participant = {
  clientId: string;
  coachMembershipId: string;
  organizationId: string;
  party: CallParty;
};

@Injectable()
export class CreateCallProposalUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: CreateCallProposalInput) {
    if (!isValidCallTime(input.time)) {
      throw new BadRequestException('Call time must be a quarter hour between 08:00 and 21:45');
    }
    const participant = await this.resolveParticipant(context, input.clientId);
    const thread = await this.ensureThread(participant);
    const expiresAt = this.expiryDate();
    const proposal = await this.prisma.callProposal.create({
      data: {
        clientId: participant.clientId,
        coachMembershipId: participant.coachMembershipId,
        date: new Date(input.date),
        initiatedBy: participant.party,
        lastProposedBy: participant.party,
        proposedTime: input.time,
        threadId: thread.id,
        messages: {
          create: {
            expiresAt,
            senderRole: participant.party,
            senderSubject: context.subject,
            threadId: thread.id,
          },
        },
      },
    });
    await this.touchThread(thread.id);
    return { id: proposal.id, threadId: thread.id };
  }

  private expiryDate(): Date {
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + CHAT_RETENTION_DAYS);
    return expiresAt;
  }

  private async touchThread(threadId: string): Promise<void> {
    await this.prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  }

  private async ensureThread(participant: Participant) {
    return this.prisma.chatThread.upsert({
      where: {
        coachMembershipId_clientId: {
          clientId: participant.clientId,
          coachMembershipId: participant.coachMembershipId,
        },
      },
      create: {
        clientId: participant.clientId,
        coachMembershipId: participant.coachMembershipId,
        organizationId: participant.organizationId,
      },
      update: { archivedAt: null },
      select: { id: true },
    });
  }

  private async resolveParticipant(context: AuthContext, clientId?: string): Promise<Participant> {
    if (context.activeRole === 'client') return this.resolveClient(context.email);
    if (context.activeRole === 'coach') return this.resolveCoach(context.subject, clientId);
    throw new ForbiddenException('Only coach or client can propose a call');
  }

  private async resolveClient(email: string | undefined): Promise<Participant> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email: email ?? '' },
      select: { coachMembershipId: true, id: true, organizationId: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return { ...client, clientId: client.id, party: 'CLIENT' };
  }

  private async resolveCoach(subject: string, clientId?: string): Promise<Participant> {
    if (!clientId) throw new BadRequestException('clientId is required for coach role');
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true, organizationId: true },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId: membership.id, id: clientId },
      select: { id: true },
    });
    if (!client) throw new ForbiddenException('Client not found for current coach');
    return {
      clientId,
      coachMembershipId: membership.id,
      organizationId: membership.organizationId,
      party: 'COACH',
    };
  }
}
