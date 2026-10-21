import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { mergeWorkoutGuide, readWorkoutGuide, workoutGuidePatchSchema, workoutGuideResponse } from '@trainerpro/shared';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class FirstWorkoutGuideService {
  constructor(private readonly db: PrismaService) {}

  async get(context: AuthContext) {
    const client = await this.resolve(context);
    return this.response(client.id, client.firstWorkoutGuide);
  }

  async patch(context: AuthContext, input: unknown) {
    const parsed = workoutGuidePatchSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid workout guide progress');
    const client = await this.resolve(context);
    const state = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM client WHERE id = ${client.id}::uuid FOR UPDATE`;
      const fresh = await tx.client.findUniqueOrThrow({ where: { id: client.id } });
      if (fresh.archivedAt) throw new NotFoundException('Client profile not found');
      const next = mergeWorkoutGuide(readWorkoutGuide(fresh.firstWorkoutGuide), parsed.data);
      await tx.client.update({
        where: { id: client.id },
        data: { firstWorkoutGuide: next, ...buildUpdateAuditFields(context) },
      });
      return next;
    });
    return this.response(client.id, state);
  }

  private async response(clientId: string, state: unknown) {
    const closed = await this.db.sessionInstance.findFirst({
      where: { clientId, archivedAt: null, OR: [{ isIncomplete: true }, { isCompleted: true }, { status: 'COMPLETED' }] },
      select: { id: true },
    });
    return workoutGuideResponse(state, Boolean(closed));
  }

  private async resolve(context: AuthContext) {
    if (context.activeRole !== 'client') throw new ForbiddenException('Only clients can access this guide');
    if (!context.email) throw new NotFoundException('Client profile not found');
    const client = await this.db.client.findFirst({
      where: { email: context.email, archivedAt: null },
      select: { id: true, firstWorkoutGuide: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }
}
