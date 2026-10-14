import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageSender, LibraryItemScope, Role } from '@prisma/client';
import { z } from 'zod';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { PrismaService } from '../../../common/prisma/prisma.service';

const patchSchema = z.object({ hidden: z.boolean() }).strict();

@Injectable()
export class CoachOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async get(context: AuthContext) {
    const coach = await this.resolve(context);
    const ownClient = { coachMembershipId: coach.id, organizationId: coach.organizationId, archivedAt: null };
    const [client, routine, assignment, message] = await Promise.all([
      this.prisma.client.findFirst({ where: ownClient, select: { id: true } }),
      this.prisma.planTemplate.findFirst({
        where: { coachMembershipId: coach.id, archivedAt: null, scope: LibraryItemScope.COACH },
        select: { id: true },
      }),
      this.prisma.client.findFirst({
        where: {
          ...ownClient,
          trainingPlanId: { not: null },
          trainingPlan: {
            archivedAt: null,
            OR: [{ coachMembershipId: coach.id }, { scope: LibraryItemScope.GLOBAL, coachMembershipId: null }],
          },
        },
        select: { id: true },
      }),
      this.prisma.chatMessage.findFirst({
        where: {
          senderRole: ChatMessageSender.COACH,
          senderSubject: context.subject,
          thread: { ...ownClient, client: { coachMembershipId: coach.id, archivedAt: null } },
        },
        select: { id: true },
      }),
    ]);
    return {
      hidden: coach.onboardingHidden,
      steps: {
        client: Boolean(client),
        routine: Boolean(routine),
        assignment: Boolean(assignment),
        message: Boolean(message),
      },
    };
  }

  async patch(context: AuthContext, input: unknown) {
    const parsed = patchSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Only a hidden boolean is accepted');
    const coach = await this.resolve(context);
    await this.prisma.organizationMember.update({ where: { id: coach.id }, data: { onboardingHidden: parsed.data.hidden } });
    return this.get(context);
  }

  private async resolve(context: AuthContext) {
    if (context.activeRole !== 'coach') throw new ForbiddenException('Only coaches can access onboarding');
    const coach = await this.prisma.organizationMember.findFirst({
      where: { role: Role.COACH, isActive: true, archivedAt: null, user: { supabaseUid: context.subject } },
      select: { id: true, organizationId: true, onboardingHidden: true },
    });
    if (!coach) throw new NotFoundException('Coach membership not found');
    return coach;
  }
}
