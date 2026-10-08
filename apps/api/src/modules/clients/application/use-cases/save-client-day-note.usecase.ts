import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

const NOTE_MAX_CHARS = 2000;

@Injectable()
export class SaveClientDayNoteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, date: string, content: string): Promise<{ saved: boolean }> {
    const client = await this.resolveClient(context);
    const text = content.trim().slice(0, NOTE_MAX_CHARS);
    if (text.length === 0) {
      await this.prisma.clientDayNote.deleteMany({ where: { clientId: client.id, date: new Date(date) } });
      return { saved: false };
    }
    await this.prisma.clientDayNote.upsert({
      where: { clientId_date: { clientId: client.id, date: new Date(date) } },
      create: { clientId: client.id, content: text, date: new Date(date) },
      update: { content: text },
    });
    return { saved: true };
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
