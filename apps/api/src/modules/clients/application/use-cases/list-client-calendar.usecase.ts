import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type ClientCalendarEvent = {
  id: string;
  type: string;
  date: Date;
  title: string | null;
  content: string | null;
  time: string | null;
  color: string | null;
  planDayId: string | null;
  planDayTitle: string | undefined;
};

type ListClientCalendarInput = {
  dateFrom: Date;
  dateTo: Date;
};

@Injectable()
export class ListClientCalendarUseCase {
  constructor(private readonly prisma: PrismaService) {}

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
        planDayId: true,
        planDay: { select: { title: true } },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        type: r.type,
        date: r.date,
        title: r.title,
        content: r.content,
        time: r.time,
        color: r.color,
        planDayId: r.planDayId,
        planDayTitle: r.planDay?.title,
      })),
    };
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
