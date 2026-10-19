import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../../../common/prisma/prisma.service';

const revisionDays = z.object({ days: z.array(z.object({ id: z.string() })) });

@Injectable()
export class ClientRoutineColorsService {
  constructor(private readonly db: PrismaService) {}

  async list(clientId: string) {
    const colors = await this.db.clientRoutineDayColor.findMany({
      where: { clientId },
      select: { planDayId: true, color: true },
      orderBy: { planDayId: 'asc' },
    });
    return { colors: colors.map(({ planDayId, color }) => ({ planDayId, color })) };
  }

  async save(clientId: string, planDayId: string, color: string) {
    return this.db.$transaction(async (tx) => {
      // Routine handoff also locks the client, so validation sees a consistent assignment.
      await tx.$queryRaw`SELECT id FROM client WHERE id = ${clientId}::uuid FOR UPDATE`;
      const client = await tx.client.findUniqueOrThrow({
        where: { id: clientId },
        include: { activeRoutineAssignment: { include: { revision: true } } },
      });
      if (client.archivedAt) throw new NotFoundException('Client not found');
      const content = client.activeRoutineAssignment?.revision.content;
      const snapshot = revisionDays.safeParse(content);
      const assigned =
        content != null
          ? snapshot.success && snapshot.data.days.some((day) => day.id === planDayId)
          : client.trainingPlanId &&
            (await tx.planDay.findFirst({
              where: { id: planDayId, templateId: client.trainingPlanId, archivedAt: null },
              select: { id: true },
            }));
      if (!assigned) throw new BadRequestException('Day does not belong to the assigned routine');
      return tx.clientRoutineDayColor.upsert({
        where: { clientId_planDayId: { clientId, planDayId } },
        create: { clientId, planDayId, color },
        update: { color },
        select: { planDayId: true, color: true },
      });
    });
  }
}
