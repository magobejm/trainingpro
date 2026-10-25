import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { clientIntakeAnswersSchema, fatigueFromSleep, parqNeedsCoachReview } from '@trainerpro/shared';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { ResolveChatThreadUseCase } from '../../../chat/application/use-cases/resolve-chat-thread.usecase';
import { SendChatMessageUseCase } from '../../../chat/application/use-cases/send-chat-message.usecase';
import { NutritionService } from '../../../nutrition/application/nutrition.service';
import { PhysicalTestsService } from '../../../physical-tests/application/physical-tests.service';
import { resolveCoachMembership } from '../../infra/prisma/client.repository.prisma.ops';
import { GetClientMeUseCase } from '../use-cases/get-client-me.usecase';
import { UpdateClientUseCase } from '../use-cases/update-client.usecase';

type BulkAction =
  | { action: 'assignNutritionPlan'; planId: string }
  | { action: 'assignRoutine'; templateId: string }
  | { action: 'broadcastMessage'; message: string }
  | { action: 'scheduleTest'; date: string; physicalTestId: string };

@Injectable()
export class ClientProductivityService {
  constructor(
    private readonly getMe: GetClientMeUseCase,
    private readonly messages: SendChatMessageUseCase,
    private readonly nutrition: NutritionService,
    private readonly prisma: PrismaService,
    private readonly tests: PhysicalTestsService,
    private readonly threads: ResolveChatThreadUseCase,
    private readonly updateClient: UpdateClientUseCase,
  ) {}

  async saveCheckin(
    context: AuthContext,
    input: { date: string; motivation: number; pain?: number | null; recovery: number; sleep: number },
  ) {
    const client = await this.getMe.execute(context);
    const date = new Date(`${input.date}T00:00:00.000Z`);
    return this.prisma.dailyCheckin.upsert({
      create: {
        clientId: client.id,
        coachMembershipId: client.coachMembershipId,
        date,
        fatigue: fatigueFromSleep(input.sleep),
        motivation: input.motivation,
        pain: input.pain ?? null,
        recovery: input.recovery,
        sleep: input.sleep,
      },
      update: {
        fatigue: fatigueFromSleep(input.sleep),
        motivation: input.motivation,
        pain: input.pain ?? null,
        recovery: input.recovery,
        sleep: input.sleep,
      },
      where: { clientId_date: { clientId: client.id, date } },
    });
  }

  async saveIntake(context: AuthContext, answers: unknown, complete: boolean) {
    const client = await this.getMe.execute(context);
    const parsed = clientIntakeAnswersSchema.parse(answers);
    const intake = await this.prisma.clientIntake.upsert({
      create: { answers: parsed, clientId: client.id, status: complete ? 'COMPLETED' : 'PENDING' },
      update: { answers: parsed, ...(complete ? { completedAt: new Date(), status: 'COMPLETED' as const } : {}) },
      where: { clientId: client.id },
    });
    if (!complete) return intake;
    await this.prisma.client.update({
      data: {
        allergies: parsed.allergies || null,
        availableDays: parsed.availableDays,
        equipment: parsed.equipment,
        injuries: parsed.injuries || null,
        parqFlags: parqNeedsCoachReview(parsed) ? parsed.parq : Prisma.JsonNull,
      },
      where: { id: client.id },
    });
    if (parsed.weightKg != null || parsed.waistCm != null) {
      await this.prisma.clientMeasurement.create({
        data: {
          clientId: client.id,
          heightCm: parsed.heightCm,
          hipCm: parsed.hipCm,
          recordedBy: 'client',
          waistCm: parsed.waistCm,
          weightKg: parsed.weightKg,
        },
      });
    }
    if (parqNeedsCoachReview(parsed)) await this.openParqIncident(client, context.subject);
    return intake;
  }

  async readMyIntake(context: AuthContext) {
    const client = await this.getMe.execute(context);
    return this.prisma.clientIntake.findUnique({ where: { clientId: client.id } });
  }

  async readClientIntake(context: AuthContext, clientId: string) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const client = await this.prisma.client.findFirst({ where: { coachMembershipId: membership.id, id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    return this.prisma.clientIntake.findUnique({ where: { clientId } });
  }

  async recordMeasurement(context: AuthContext, clientId: string, input: MeasurementWrite) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId: membership.id, id: clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    const row = await this.prisma.clientMeasurement.create({
      data: {
        ...input,
        clientId,
        measuredAt: new Date(input.measuredAt),
        recordedBy: 'coach',
        skinfoldsJson: input.skinfoldsJson ?? Prisma.JsonNull,
      },
    });
    await this.prisma.client.update({
      data: {
        fcMax: input.fcMax ?? undefined,
        fcRest: input.fcRest ?? undefined,
        heightCm: input.heightCm ?? undefined,
        hipCm: input.hipCm == null ? undefined : Math.round(input.hipCm),
        waistCm: input.waistCm == null ? undefined : Math.round(input.waistCm),
        weightKg: input.weightKg ?? undefined,
      },
      where: { id: clientId },
    });
    return row;
  }

  async reviewReport(context: AuthContext, clientId: string, reportId: string) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const report = await this.prisma.weeklyReport.findFirst({
      where: { clientId, coachMembershipId: membership.id, id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.weeklyReport.update({ data: { reviewedAt: new Date() }, where: { id: reportId } });
  }

  async bulk(context: AuthContext, clientIds: string[], action: BulkAction) {
    if (clientIds.length > 100) throw new BadRequestException('Bulk actions accept at most 100 clients');
    const results = [];
    for (const clientId of clientIds) {
      try {
        await this.runOne(context, clientId, action);
        results.push({ clientId, status: 'ok' as const });
      } catch (error) {
        results.push({ clientId, message: error instanceof Error ? error.message : 'error', status: 'error' as const });
      }
    }
    return { results };
  }

  private async runOne(context: AuthContext, clientId: string, action: BulkAction) {
    if (action.action === 'assignRoutine') {
      await this.updateClient.execute(context, clientId, { trainingPlanId: action.templateId });
      return;
    }
    if (action.action === 'assignNutritionPlan') {
      await this.nutrition.assignPlan(context, action.planId, clientId);
      return;
    }
    if (action.action === 'scheduleTest') {
      await this.tests.scheduleTestForCoach(context, clientId, action);
      return;
    }
    const client = await this.prisma.client.findFirst({ select: { firstName: true }, where: { id: clientId } });
    const thread = await this.threads.execute(context, { clientId });
    await this.messages.execute(context, {
      text: action.message.replaceAll('{nombre}', client?.firstName ?? ''),
      threadId: thread.id,
    });
  }

  private openParqIncident(client: { coachMembershipId: string; id: string; organizationId: string }, subject: string) {
    return this.prisma.incident.create({
      data: {
        clientId: client.id,
        coachMembershipId: client.coachMembershipId,
        createdBy: subject,
        description: 'El cuestionario PAR-Q tiene al menos una respuesta afirmativa.',
        organizationId: client.organizationId,
        severity: 'MEDIUM',
        updatedBy: subject,
      },
    });
  }
}

type MeasurementWrite = {
  bodyFatPct?: number | null;
  fcMax?: number | null;
  fcRest?: number | null;
  heightCm?: number | null;
  hipCm?: number | null;
  measuredAt: string;
  notes?: string | null;
  skinfoldsJson?: Prisma.InputJsonValue | null;
  waistCm?: number | null;
  weightKg?: number | null;
};
