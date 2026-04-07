import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  CALENDAR_REPOSITORY,
  type CreateCalendarEventInput,
  type ICalendarRepository,
} from '../../domain/calendar.repository.port';

@Injectable()
export class CreateCalendarEventUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY)
    private readonly calendarRepository: ICalendarRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(context: AuthContext, input: CreateCalendarEventInput) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can create calendar events');
    }
    const membership = await this.readCoachMembership(context.subject);
    return this.calendarRepository.create(membership.id, input);
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
