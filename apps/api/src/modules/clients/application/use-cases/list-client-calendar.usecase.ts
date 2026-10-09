import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { PhysicalTestsRepository } from '../../../physical-tests/infra/prisma/physical-tests.repository';

export type ClientCalendarEvent = {
  id: string;
  type: string;
  callStatus?: 'accepted';
  date: Date;
  title: string | null;
  content: string | null;
  time: string | null;
  color: string | null;
  isCompleted: boolean;
  originDate: string | null;
  planDayId: string | null;
  planDayTitle: string | undefined;
  scheduleId?: string;
};

type ListClientCalendarInput = {
  dateFrom: Date;
  dateTo: Date;
};

@Injectable()
export class ListClientCalendarUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly physicalTests: PhysicalTestsRepository,
  ) {}

  async execute(context: AuthContext, input: ListClientCalendarInput): Promise<{ data: ClientCalendarEvent[] }> {
    const client = await this.resolveClient(context);
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        clientId: client.id,
        archivedAt: null,
        date: { gte: input.dateFrom, lte: input.dateTo },
      },
      select: {
        id: true,
        type: true,
        date: true,
        title: true,
        content: true,
        time: true,
        color: true,
        originDate: true,
        planDayId: true,
        planDay: { select: { title: true } },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });
    const completed = await this.loadCompletedDays(client.id, input);
    const notes = await this.loadClientNotes(client.id, input);
    const tests = await this.physicalTests.listScheduleCalendarRows({
      clientId: client.id,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    return {
      data: [
        ...tests.map((test) => ({
          color: null,
          content: null,
          date: test.scheduledDate,
          id: test.id,
          isCompleted: test.done,
          originDate: null,
          planDayId: null,
          planDayTitle: undefined,
          scheduleId: test.id,
          time: null,
          title: test.testName,
          type: 'physical_test',
        })),
        ...rows.map((r) => ({
          id: r.id,
          type: r.type,
          ...(r.type === 'call' ? { callStatus: 'accepted' as const } : {}),
          date: r.date,
          title: r.title,
          content: r.content,
          time: r.time,
          color: r.color,
          isCompleted: r.type === 'workout' && completed.has(r.date.toISOString().slice(0, 10)),
          originDate: r.originDate ? r.originDate.toISOString().slice(0, 10) : null,
          planDayId: r.planDayId,
          planDayTitle: r.planDay?.title,
        })),
        ...notes,
      ],
    };
  }

  /** Notas privadas del cliente: solo salen en su propio calendario. */
  private async loadClientNotes(clientId: string, input: ListClientCalendarInput): Promise<ClientCalendarEvent[]> {
    const rows = await this.prisma.clientDayNote.findMany({
      where: { clientId, date: { gte: input.dateFrom, lte: input.dateTo } },
      select: { content: true, date: true, id: true },
      orderBy: { date: 'asc' },
    });
    return rows.map((row) => ({
      callStatus: undefined,
      color: null,
      content: row.content,
      date: row.date,
      id: row.id,
      isCompleted: false,
      originDate: null,
      planDayId: null,
      planDayTitle: undefined,
      time: null,
      title: null,
      type: 'client_note',
    }));
  }

  private async loadCompletedDays(clientId: string, input: ListClientCalendarInput): Promise<Set<string>> {
    const rows = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId,
        isCompleted: true,
        sessionDate: { gte: input.dateFrom, lte: input.dateTo },
      },
      select: { sessionDate: true },
    });
    return new Set(rows.map((row) => row.sessionDate.toISOString().slice(0, 10)));
  }

  private async resolveClient(context: AuthContext) {
    const email = context.email;
    if (!email) throw new NotFoundException('Client profile not found');
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }
}
