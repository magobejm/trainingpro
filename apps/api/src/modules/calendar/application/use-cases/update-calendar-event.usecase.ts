import { pendingProposalAsEvent } from '../../domain/call-status';
import { ManageCallProposalUseCase } from '../../../calls/application/use-cases/manage-call-proposal.usecase';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  CALENDAR_REPOSITORY,
  type ICalendarRepository,
  type UpdateCalendarEventInput,
} from '../../domain/calendar.repository.port';

@Injectable()
export class UpdateCalendarEventUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY)
    private readonly calendarRepository: ICalendarRepository,
    private readonly prisma: PrismaService,
    private readonly manageCall: ManageCallProposalUseCase,
  ) {}

  async execute(context: AuthContext, eventId: string, input: UpdateCalendarEventInput) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can update calendar events');
    }
    const membership = await this.readCoachMembership(context.subject);
    const proposal = await this.prisma.callProposal.findFirst({
      where: { coachMembershipId: membership.id, OR: [{ id: eventId }, { calendarEventId: eventId }] },
      select: { id: true },
    });
    if (proposal) {
      const replacement = await this.manageCall.reschedule(context, proposal.id, input);
      const event = pendingProposalAsEvent(replacement);
      return replacement.status === 'accepted'
        ? { ...event, id: replacement.calendarEventId ?? replacement.id, callStatus: 'accepted' as const }
        : event;
    }

    return this.calendarRepository.update(eventId, membership.id, input);
  }

  private async readCoachMembership(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    return membership;
  }
}
