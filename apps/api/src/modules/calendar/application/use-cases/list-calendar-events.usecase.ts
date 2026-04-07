import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  CALENDAR_REPOSITORY,
  type ICalendarRepository,
  type ListCalendarEventsQuery,
} from '../../domain/calendar.repository.port';

@Injectable()
export class ListCalendarEventsUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY)
    private readonly calendarRepository: ICalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, query: ListCalendarEventsQuery) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can list calendar events');
    }
    const membership = await this.readCoachMembership(context.subject);
    const events = await this.calendarRepository.list(membership.id, query);
    return { data: events };
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
