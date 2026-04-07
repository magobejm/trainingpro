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
  ) {}

  async execute(context: AuthContext, eventId: string, input: UpdateCalendarEventInput) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can update calendar events');
    }
    const membership = await this.readCoachMembership(context.subject);
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
