import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { readWorkoutAdherence, type WorkoutAdherenceInput } from '../../../../common/plan/workout-adherence.prisma';

@Injectable()
export class GetAdherenceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext, input: Omit<WorkoutAdherenceInput, 'clientId'> & { clientId?: string }) {
    if (context.activeRole === 'coach' && !input.clientId)
      throw new ForbiddenException('clientId is required for coach progress queries');
    if (context.activeRole !== 'coach' && context.activeRole !== 'client')
      throw new ForbiddenException('Client progress is restricted');
    const client = await this.prisma.client.findFirst({
      select: { id: true },
      where: {
        archivedAt: null,
        ...(input.clientId ? { id: input.clientId } : {}),
        ...(context.activeRole === 'coach'
          ? {
              coachMembership: { archivedAt: null, isActive: true, role: 'COACH', user: { supabaseUid: context.subject } },
            }
          : { user: { supabaseUid: context.subject } }),
      },
    });
    if (!client) throw new ForbiddenException('Client not found for current user');
    return readWorkoutAdherence(this.prisma, { ...input, clientId: client.id });
  }
}
