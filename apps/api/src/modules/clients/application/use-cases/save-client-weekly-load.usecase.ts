import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isMondayKey, WEEKLY_LOAD_MAX_CHARS } from '@trainerpro/shared';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class SaveClientWeeklyLoadUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /** Guarda (o borra, si llega vacío) lo que el cliente espera de la semana que empieza en `weekStartDate`. */
  async execute(context: AuthContext, weekStartDate: string, content: string): Promise<{ saved: boolean }> {
    if (!isMondayKey(weekStartDate)) throw new BadRequestException('weekStartDate must be a Monday');
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email: context.email ?? '' },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const text = content.trim().slice(0, WEEKLY_LOAD_MAX_CHARS);
    if (text.length === 0) {
      await this.prisma.clientWeeklyLoad.deleteMany({ where: { clientId: client.id, weekStartDate: weekStart } });
      return { saved: false };
    }
    await this.prisma.clientWeeklyLoad.upsert({
      where: { clientId_weekStartDate: { clientId: client.id, weekStartDate: weekStart } },
      create: { clientId: client.id, content: text, weekStartDate: weekStart },
      update: { content: text },
    });
    return { saved: true };
  }
}
