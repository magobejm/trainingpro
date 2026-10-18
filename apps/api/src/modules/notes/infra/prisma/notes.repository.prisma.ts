import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { completeQueryPage, queryPageWindow, type PageSlice } from '../../../../common/pagination/page-query';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CoachNoteEntity,
  CreateNoteInput,
  INotesRepository,
  ListNotesQuery,
  UpdateNoteInput,
} from '../../domain/notes.repository.port';

@Injectable()
export class NotesRepositoryPrisma implements INotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(coachMembershipId: string, input: CreateNoteInput): Promise<CoachNoteEntity> {
    if (input.type === 'client' && !input.clientId) {
      throw new ForbiddenException('clientId is required for client notes');
    }
    if (input.type === 'client' && input.clientId) {
      await this.assertCoachClient(coachMembershipId, input.clientId);
    }
    const row = await this.prisma.coachNote.create({
      data: {
        coachMembershipId,
        type: input.type,
        clientId: input.clientId ?? null,
        content: input.content.trim(),
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });
    return this.mapNote(row);
  }

  async findById(id: string, coachMembershipId: string): Promise<CoachNoteEntity | null> {
    const row = await this.prisma.coachNote.findFirst({
      where: { id, coachMembershipId, archivedAt: null },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });
    return row ? this.mapNote(row) : null;
  }

  async list(coachMembershipId: string, query: ListNotesQuery): Promise<CoachNoteEntity[]> {
    const where = await this.buildListWhere(coachMembershipId, query);
    const rows = await this.prisma.coachNote.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(
      (r: {
        id: string;
        coachMembershipId: string;
        type: string;
        clientId: string | null;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        client?: { firstName: string; lastName: string } | null;
      }) => this.mapNote(r),
    );
  }

  async listPage(coachMembershipId: string, query: ListNotesQuery): Promise<PageSlice<CoachNoteEntity>> {
    if (!query.limit) return { items: await this.list(coachMembershipId, query) };
    const { after: cursor, take } = queryPageWindow(query);
    if (cursor && !Number.isFinite(Date.parse(cursor.sort))) throw new BadRequestException('cursor: invalid');
    if (query.clientId) await this.assertCoachClient(coachMembershipId, query.clientId);

    const filters = [Prisma.sql`coach_membership_id = ${coachMembershipId}::uuid`, Prisma.sql`archived_at IS NULL`];
    if (query.type) filters.push(Prisma.sql`type = ${query.type}`);
    if (query.clientId) filters.push(Prisma.sql`client_id = ${query.clientId}::uuid`);
    if (query.dateFrom) filters.push(Prisma.sql`created_at >= ${query.dateFrom}`);
    if (query.dateTo) filters.push(Prisma.sql`created_at <= ${query.dateTo}`);
    if (cursor) {
      const cursorDate = new Date(cursor.sort);
      filters.push(Prisma.sql`(
        date_trunc('milliseconds', created_at AT TIME ZONE 'UTC') < (${cursorDate}::timestamptz AT TIME ZONE 'UTC')
        OR (date_trunc('milliseconds', created_at AT TIME ZONE 'UTC') = (${cursorDate}::timestamptz AT TIME ZONE 'UTC')
          AND id::text COLLATE "C" < ${cursor.id} COLLATE "C")
      )`);
    }

    return this.prisma.$transaction(
      async (tx) => {
        const candidates = await tx.$queryRaw<Array<{ id: string; createdAt: Date }>>(Prisma.sql`
        SELECT id::text AS id, created_at AS "createdAt"
        FROM coach_note
        WHERE ${Prisma.join(filters, ' AND ')}
        ORDER BY date_trunc('milliseconds', created_at AT TIME ZONE 'UTC') DESC, id::text COLLATE "C" DESC
        LIMIT ${take!}
      `);
        const page = completeQueryPage(candidates, query, {
          direction: 'desc',
          id: (note) => note.id,
          sort: (note) => note.createdAt.toISOString(),
        });
        const visible = page.items;
        if (visible.length === 0) return { items: [], nextCursor: null };

        const rows = await tx.coachNote.findMany({
          where: { id: { in: visible.map((item) => item.id) } },
          include: { client: { select: { firstName: true, lastName: true } } },
        });
        const byId = new Map(rows.map((row) => [row.id, this.mapNote(row)]));
        const items = visible.flatMap((item) => {
          const note = byId.get(item.id);
          return note ? [note] : [];
        });
        return { items, nextCursor: page.nextCursor };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async buildListWhere(coachMembershipId: string, query: ListNotesQuery): Promise<{ [key: string]: unknown }> {
    const where: { [key: string]: unknown } = { coachMembershipId, archivedAt: null };
    if (query.type) where.type = query.type;
    if (query.clientId) {
      await this.assertCoachClient(coachMembershipId, query.clientId);
      where.clientId = query.clientId;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) (where.createdAt as { [key: string]: Date }).gte = query.dateFrom;
      if (query.dateTo) (where.createdAt as { [key: string]: Date }).lte = query.dateTo;
    }
    return where;
  }

  async update(id: string, coachMembershipId: string, input: UpdateNoteInput): Promise<CoachNoteEntity> {
    const existing = await this.findById(id, coachMembershipId);
    if (!existing) {
      throw new NotFoundException('Note not found');
    }
    const updated = await this.prisma.coachNote.update({
      where: { id },
      data: { content: input.content.trim() },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });
    return this.mapNote(updated);
  }

  async delete(id: string, coachMembershipId: string): Promise<void> {
    const existing = await this.findById(id, coachMembershipId);
    if (!existing) {
      throw new NotFoundException('Note not found');
    }
    await this.prisma.coachNote.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  private async assertCoachClient(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found for current coach');
    }
  }

  private mapNote(row: {
    id: string;
    coachMembershipId: string;
    type: string;
    clientId: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    client?: { firstName: string; lastName: string } | null;
  }): CoachNoteEntity {
    return {
      id: row.id,
      coachMembershipId: row.coachMembershipId,
      type: row.type as 'client' | 'general',
      clientId: row.clientId,
      clientName: row.client ? `${row.client.firstName} ${row.client.lastName}` : undefined,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
