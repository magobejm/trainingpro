import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

const PAGE_SIZE = 30;

type ListClientDayNotesInput = {
  before?: string;
  query?: string;
};

type ClientDayNoteItem = {
  content: string;
  date: string;
  updatedAt: string;
};

@Injectable()
export class ListClientDayNotesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    context: AuthContext,
    input: ListClientDayNotesInput,
  ): Promise<{ items: ClientDayNoteItem[]; nextBefore: string | null }> {
    const client = await this.resolveClient(context);
    const rows = await this.prisma.clientDayNote.findMany({
      orderBy: { date: 'desc' },
      select: { content: true, date: true, updatedAt: true },
      take: PAGE_SIZE + 1,
      where: this.where(client.id, input),
    });
    const page = rows.slice(0, PAGE_SIZE);
    const last = page.at(-1);
    return {
      items: page.map((row) => ({
        content: row.content,
        date: row.date.toISOString().slice(0, 10),
        updatedAt: row.updatedAt.toISOString(),
      })),
      nextBefore: rows.length > PAGE_SIZE && last ? last.date.toISOString().slice(0, 10) : null,
    };
  }

  private where(clientId: string, input: ListClientDayNotesInput) {
    const term = input.query?.trim() ?? '';
    return {
      clientId,
      ...(input.before ? { date: { lt: new Date(input.before) } } : {}),
      ...(term.length >= 2 ? { content: { contains: term, mode: 'insensitive' as const } } : {}),
    };
  }

  private async resolveClient(context: AuthContext) {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email: context.email ?? '' },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }
}
