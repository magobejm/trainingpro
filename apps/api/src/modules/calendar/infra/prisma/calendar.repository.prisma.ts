import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CalendarEventEntity,
  CreateCalendarEventInput,
  ICalendarRepository,
  ListCalendarEventsQuery,
  UpdateCalendarEventInput,
} from '../../domain/calendar.repository.port';

type PrismaCalendarRow = {
  id: string;
  coachMembershipId: string;
  clientId: string | null;
  type: string;
  date: Date;
  title: string | null;
  content: string | null;
  time: string | null;
  color: string | null;
  planDayId: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: { firstName: string; lastName: string } | null;
  planDay?: { title: string } | null;
};

const INCLUDE_RELATIONS = {
  client: { select: { firstName: true, lastName: true } },
  planDay: { select: { title: true } },
} as const;

@Injectable()
export class CalendarRepositoryPrisma implements ICalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(coachMembershipId: string, input: CreateCalendarEventInput): Promise<CalendarEventEntity> {
    if (input.clientId) {
      await this.assertCoachClient(coachMembershipId, input.clientId);
    }
    const row = await this.prisma.calendarEvent.create({
      data: {
        coachMembershipId,
        clientId: input.clientId ?? null,
        type: input.type,
        date: new Date(input.date),
        title: input.title?.trim() ?? null,
        content: input.content?.trim() ?? null,
        time: input.time ?? null,
        color: input.color ?? null,
        planDayId: input.planDayId ?? null,
      },
      include: INCLUDE_RELATIONS,
    });
    return this.mapRow(row);
  }

  async findById(id: string, coachMembershipId: string): Promise<CalendarEventEntity | null> {
    const row = await this.prisma.calendarEvent.findFirst({
      where: { id, coachMembershipId, archivedAt: null },
      include: INCLUDE_RELATIONS,
    });
    return row ? this.mapRow(row) : null;
  }

  async list(coachMembershipId: string, query: ListCalendarEventsQuery): Promise<CalendarEventEntity[]> {
    if (query.clientId) {
      await this.assertCoachClient(coachMembershipId, query.clientId);
    }
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        coachMembershipId,
        archivedAt: null,
        date: { gte: query.dateFrom, lte: query.dateTo },
        ...(query.coachOnly ? { clientId: null } : query.clientId ? { clientId: query.clientId } : {}),
      },
      include: INCLUDE_RELATIONS,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r: PrismaCalendarRow) => this.mapRow(r));
  }

  async update(id: string, coachMembershipId: string, input: UpdateCalendarEventInput): Promise<CalendarEventEntity> {
    const existing = await this.findById(id, coachMembershipId);
    if (!existing) throw new NotFoundException('Calendar event not found');
    const row = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.content !== undefined ? { content: input.content.trim() } : {}),
        ...(input.time !== undefined ? { time: input.time } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      },
      include: INCLUDE_RELATIONS,
    });
    return this.mapRow(row);
  }

  async delete(id: string, coachMembershipId: string): Promise<void> {
    const existing = await this.findById(id, coachMembershipId);
    if (!existing) throw new NotFoundException('Calendar event not found');
    await this.prisma.calendarEvent.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  private async assertCoachClient(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { id: true },
    });
    if (!client) throw new ForbiddenException('Client not found for current coach');
  }

  private mapRow(row: PrismaCalendarRow): CalendarEventEntity {
    return {
      id: row.id,
      coachMembershipId: row.coachMembershipId,
      clientId: row.clientId,
      clientName: row.client ? `${row.client.firstName} ${row.client.lastName}` : undefined,
      type: row.type as 'note' | 'reminder' | 'workout',
      date: row.date,
      title: row.title,
      content: row.content,
      time: row.time,
      color: row.color,
      planDayId: row.planDayId,
      planDayTitle: row.planDay?.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
