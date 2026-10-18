import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  archivePreviewWorkouts,
  handoffTransaction,
  lockHandoffRows,
  readHandoffPreview,
} from '../../infra/prisma/routine-handoff.prisma';

export type ClearFutureWorkoutsInput = {
  clientId: string;
  from: string;
  dryRun?: boolean;
  candidateTemplateId?: string;
};

@Injectable()
export class ClearFutureWorkoutsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: ClearFutureWorkoutsInput) {
    if (context.activeRole !== 'coach') throw new ForbiddenException('Only coach can clear future workouts');
    const membership = await this.readCoachMembership(context.subject);
    await this.assertClient(membership.id, input.clientId);
    return handoffTransaction(
      this.prisma,
      async (tx) => {
        if (!input.dryRun) await lockHandoffRows(tx, input.clientId);
        const preview = await readHandoffPreview(tx, membership.id, input.clientId, input.from, input.candidateTemplateId);
        if (input.dryRun) return preview;
        const result = await archivePreviewWorkouts(tx, membership.id, preview);
        return { archived: result.count };
      },
      input.dryRun,
    );
  }

  private async assertClient(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { id: true },
    });
    if (!client) throw new ForbiddenException('Client not found for current coach');
  }

  private async readCoachMembership(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Coach membership not found');
    return membership;
  }
}
