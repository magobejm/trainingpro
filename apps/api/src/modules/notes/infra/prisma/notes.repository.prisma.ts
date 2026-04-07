import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    const where: { [key: string]: unknown } = {
      coachMembershipId,
      archivedAt: null,
    };
    if (query.type) {
      where.type = query.type;
    }
    if (query.clientId) {
      await this.assertCoachClient(coachMembershipId, query.clientId);
      where.clientId = query.clientId;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        (where.createdAt as { [key: string]: Date }).gte = query.dateFrom;
      }
      if (query.dateTo) {
        (where.createdAt as { [key: string]: Date }).lte = query.dateTo;
      }
    }
    const rows = await this.prisma.coachNote.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
