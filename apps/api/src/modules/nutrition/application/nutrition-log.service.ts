import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NutritionMealStatus } from '@prisma/client';
import { countAdherence, eachPlanDate, planCalendarDate, resolvePlanDay } from '@trainerpro/shared';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../files/domain/private-file-storage.port';
import { NutritionRepository } from '../infra/prisma/nutrition.repository';
import { NutritionLogRepository, type MealLogWrite } from '../infra/prisma/nutrition-log.repository';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type MealLogView = {
  comment: string | null;
  date: string;
  id: string;
  mealKey: string;
  mealName: string;
  photoPath: string | null;
  planId: string;
  status: NutritionMealStatus;
};

export type AdherenceDay = {
  changed: number;
  date: string;
  done: number;
  expected: number;
  percent: number | null;
  skipped: number;
};

@Injectable()
export class NutritionLogService {
  constructor(
    private readonly logs: NutritionLogRepository,
    private readonly plans: NutritionRepository,
    @Inject(PRIVATE_FILE_STORAGE) private readonly storage: PrivateFileStoragePort,
  ) {}

  async listMine(context: AuthContext, from: string, to: string): Promise<MealLogView[]> {
    return (await this.logs.listForClient(context, from, to)).map(mapLog);
  }

  async saveMine(context: AuthContext, input: MealLogWrite): Promise<MealLogView> {
    return mapLog(await this.logs.save(context, input));
  }

  async removeMine(context: AuthContext, logId: string): Promise<void> {
    await this.logs.remove(context, logId);
  }

  async uploadPhoto(
    context: AuthContext,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<{ photoPath: string }> {
    if (!PHOTO_TYPES.includes(file.mimetype) || file.size <= 0 || file.size > 4_000_000) {
      throw new BadRequestException('Unsupported meal photo');
    }
    const clientPlans = await this.plans.getClientAssignedPlans(context);
    const clientId = clientPlans[0]?.clientId;
    if (!clientId) throw new BadRequestException('Nutrition plan not found');
    const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const photoPath = `clients/nutrition/${clientId}/${Date.now()}.${extension}`;
    await this.storage.upload({ contentType: file.mimetype, data: file.buffer, path: photoPath, upsert: false });
    return { photoPath };
  }

  async adherence(
    context: AuthContext,
    clientId: string,
    from: string,
    to: string,
  ): Promise<{
    days: AdherenceDay[];
    summary: AdherenceDay;
  }> {
    const assigned = await this.plans.listPlansByClient(context, clientId);
    const logs = await this.logs.listForCoach(clientId, from, to);
    const days = eachPlanDate(from, to).map((date) => daySummary(assigned, logs.map(mapLog), date));
    return { days, summary: foldDays(days) };
  }
}

function daySummary(
  plans: Array<{ content: unknown; createdAt: Date; type: 'ESTRUCTURADO' | 'LIBRE' }>,
  logs: MealLogView[],
  date: string,
): AdherenceDay {
  const expected = plans.reduce((sum, plan) => {
    const day = resolvePlanDay({ content: plan.content, type: plan.type }, plan.createdAt, planCalendarDate(date));
    return sum + day.meals.length;
  }, 0);
  const statuses = logs.filter((log) => log.date === date).map((log) => log.status);
  return { date, ...countAdherence(expected, statuses) };
}

function foldDays(days: AdherenceDay[]): AdherenceDay {
  const totals = days.reduce(
    (sum, day) => ({
      changed: sum.changed + day.changed,
      done: sum.done + day.done,
      expected: sum.expected + day.expected,
      skipped: sum.skipped + day.skipped,
    }),
    { changed: 0, done: 0, expected: 0, skipped: 0 },
  );
  return { date: days[0]?.date ?? '', ...countAdherence(totals.expected, repeatStatuses(totals)) };
}

function repeatStatuses(totals: { changed: number; done: number; skipped: number }) {
  return [
    ...Array<NutritionMealStatus>(totals.done).fill('DONE'),
    ...Array<NutritionMealStatus>(totals.changed).fill('CHANGED'),
    ...Array<NutritionMealStatus>(totals.skipped).fill('SKIPPED'),
  ];
}

function mapLog(row: {
  comment: string | null;
  date: Date;
  id: string;
  mealKey: string;
  mealName: string;
  photoPath: string | null;
  planId: string;
  status: NutritionMealStatus;
}): MealLogView {
  return {
    comment: row.comment,
    date: row.date.toISOString().slice(0, 10),
    id: row.id,
    mealKey: row.mealKey,
    mealName: row.mealName,
    photoPath: row.photoPath,
    planId: row.planId,
    status: row.status,
  };
}
