import { Injectable, NotFoundException } from '@nestjs/common';
import { NutritionMealStatus, type NutritionMealLog } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type MealLogWrite = {
  comment?: string | null;
  date: string;
  mealKey: string;
  mealName: string;
  photoPath?: string | null;
  planId: string;
  status: NutritionMealStatus;
};

@Injectable()
export class NutritionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForClient(context: AuthContext, from: string, to: string): Promise<NutritionMealLog[]> {
    const client = await this.requireClient(context);
    return this.listBetween(client.id, from, to);
  }

  async listForCoach(clientId: string, from: string, to: string): Promise<NutritionMealLog[]> {
    return this.listBetween(clientId, from, to);
  }

  async save(context: AuthContext, input: MealLogWrite): Promise<NutritionMealLog> {
    const client = await this.requireClient(context);
    await this.requireOwnPlan(client.id, input.planId);
    const date = new Date(`${input.date}T00:00:00.000Z`);
    return this.prisma.nutritionMealLog.upsert({
      create: {
        clientId: client.id,
        comment: blank(input.comment),
        date,
        mealKey: input.mealKey,
        mealName: input.mealName,
        organizationId: client.organizationId,
        photoPath: blank(input.photoPath),
        planId: input.planId,
        status: input.status,
      },
      update: {
        comment: blank(input.comment),
        mealName: input.mealName,
        photoPath: blank(input.photoPath),
        status: input.status,
      },
      where: {
        clientId_planId_date_mealKey: {
          clientId: client.id,
          date,
          mealKey: input.mealKey,
          planId: input.planId,
        },
      },
    });
  }

  async remove(context: AuthContext, logId: string): Promise<void> {
    const client = await this.requireClient(context);
    const deleted = await this.prisma.nutritionMealLog.deleteMany({ where: { clientId: client.id, id: logId } });
    if (deleted.count === 0) throw new NotFoundException('Meal log not found');
  }

  private listBetween(clientId: string, from: string, to: string): Promise<NutritionMealLog[]> {
    return this.prisma.nutritionMealLog.findMany({
      orderBy: [{ date: 'asc' }, { mealKey: 'asc' }],
      where: {
        clientId,
        date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
      },
    });
  }

  private async requireClient(context: AuthContext): Promise<{ id: string; organizationId: string }> {
    const client = await this.prisma.client.findFirst({
      select: { id: true, organizationId: true },
      where: { archivedAt: null, email: context.email ?? '' },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }

  private async requireOwnPlan(clientId: string, planId: string): Promise<void> {
    const plan = await this.prisma.nutritionPlan.findFirst({
      select: { id: true },
      where: { archivedAt: null, clientId, id: planId },
    });
    if (!plan) throw new NotFoundException('Nutrition plan not found');
  }
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
