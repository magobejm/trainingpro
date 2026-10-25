import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NutritionMealStatus, type Prisma } from '@prisma/client';
import {
  countAdherence,
  eachPlanDate,
  expectedMealsOnDate,
  nutritionAmountTotals,
  planCalendarDate,
  resolvePlanDay,
} from '@trainerpro/shared';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../files/domain/private-file-storage.port';
import { PrivateMediaUrlSigner } from '../../files/domain/private-media-url-signer';
import { NutritionRepository } from '../infra/prisma/nutrition.repository';
import { NutritionLogRepository } from '../infra/prisma/nutrition-log.repository';
import { aiEstimateSchema, NutritionAiService, type AiMealEstimate, type ProductNutrition } from './nutrition-ai.service';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type EatenItemView = {
  amount: number;
  caloriesKcal: number;
  carbsG: number;
  fatG: number;
  foodId: string;
  name: string;
  proteinG: number;
  servingUnit: string | null;
};

export type MealLogView = {
  aiEstimate: AiMealEstimate | null;
  comment: string | null;
  date: string;
  eatenItems: EatenItemView[];
  id: string;
  mealKey: string;
  mealName: string;
  photoPath: string | null;
  photoUrl: string | null;
  planId: string;
  status: NutritionMealStatus;
};

export type AdherenceMeal = {
  aiEstimate: AiMealEstimate | null;
  comment: string | null;
  eatenItems: EatenItemView[];
  mealKey: string;
  mealName: string;
  photoUrl: string | null;
  status: NutritionMealStatus;
};

export type AdherenceDay = {
  changed: number;
  date: string;
  done: number;
  expected: number;
  meals: AdherenceMeal[];
  percent: number | null;
  skipped: number;
};

@Injectable()
export class NutritionLogService {
  constructor(
    private readonly logs: NutritionLogRepository,
    private readonly plans: NutritionRepository,
    private readonly signer: PrivateMediaUrlSigner,
    private readonly ai: NutritionAiService,
    @Inject(PRIVATE_FILE_STORAGE) private readonly storage: PrivateFileStoragePort,
  ) {}

  async listMine(context: AuthContext, from: string, to: string): Promise<MealLogView[]> {
    return (await this.logs.listForClient(context, from, to)).map((row) => this.toView(row));
  }

  async searchFoods(context: AuthContext, query: string | undefined) {
    const term = query?.trim() ?? '';
    if (term.length < 2) return { items: [] };
    const foods = await this.logs.searchFoods(context, term);
    return {
      items: foods.map((food) => ({
        caloriesKcal: food.caloriesKcal,
        carbsG: food.carbsG,
        fatG: food.fatG,
        foodId: food.id,
        name: food.name,
        proteinG: food.proteinG,
        servingUnit: food.servingUnit,
      })),
    };
  }

  async saveMine(context: AuthContext, input: SaveMealLog): Promise<MealLogView> {
    const eatenItems = input.status === 'CHANGED' ? await this.snapshotFoods(context, input.eatenItems ?? []) : null;
    return this.toView(await this.logs.save(context, { ...input, aiEstimate: input.aiEstimate ?? null, eatenItems }));
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

  async uploadPhotoWithEstimate(
    context: AuthContext,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<{ estimate: AiMealEstimate | null; photoPath: string }> {
    const { photoPath } = await this.uploadPhoto(context, file);
    return { estimate: await this.ai.estimateMeal(file.buffer, file.mimetype), photoPath };
  }

  /** Local library first, then Open Food Facts. Returns null (404 upstream) when the product is unknown. */
  async foodByBarcode(context: AuthContext, code: string) {
    const existing = await this.logs.findFoodByBarcode(context, code);
    if (existing) return toFoodItem(existing);
    const product = await this.ai.lookupBarcode(code);
    return product ? toFoodItem(await this.logs.createScannedFood(context, product)) : null;
  }

  async foodFromLabel(context: AuthContext, file: { buffer: Buffer; mimetype: string; size: number }, barcode?: string) {
    if (!PHOTO_TYPES.includes(file.mimetype) || file.size <= 0 || file.size > 4_000_000) {
      throw new BadRequestException('Unsupported label photo');
    }
    const product: ProductNutrition | null = await this.ai.readLabel(file.buffer, file.mimetype);
    if (!product) return null;
    return toFoodItem(await this.logs.createScannedFood(context, { ...product, barcode: barcode ?? null }));
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
    const days = eachPlanDate(from, to).map((date) =>
      daySummary(
        assigned,
        logs.map((row) => this.toView(row)),
        date,
      ),
    );
    return { days, summary: foldDays(days) };
  }

  private toView(row: {
    aiEstimate?: Prisma.JsonValue | null;
    comment: string | null;
    date: Date;
    eatenItems: Prisma.JsonValue | null;
    id: string;
    mealKey: string;
    mealName: string;
    photoPath: string | null;
    planId: string;
    status: NutritionMealStatus;
  }): MealLogView {
    return {
      aiEstimate: readAiEstimate(row.aiEstimate),
      comment: row.comment,
      date: row.date.toISOString().slice(0, 10),
      eatenItems: readEatenItems(row.eatenItems),
      id: row.id,
      mealKey: row.mealKey,
      mealName: row.mealName,
      photoPath: row.photoPath,
      photoUrl: signPhoto(this.signer, row.photoPath),
      planId: row.planId,
      status: row.status,
    };
  }

  private async snapshotFoods(context: AuthContext, items: ChosenFood[]): Promise<EatenItemView[]> {
    const foods = await this.logs.findFoods(
      context,
      items.map((item) => item.foodId),
    );
    return items.map((item) => {
      const food = foods.find((candidate) => candidate.id === item.foodId);
      if (!food) throw new BadRequestException('Food not found');
      const totals = nutritionAmountTotals(food, item.amount);
      return {
        amount: item.amount,
        caloriesKcal: totals.caloriesKcal ?? 0,
        carbsG: totals.carbsG ?? 0,
        fatG: totals.fatG ?? 0,
        foodId: food.id,
        name: food.name,
        proteinG: totals.proteinG ?? 0,
        servingUnit: food.servingUnit,
      };
    });
  }
}

type ChosenFood = { amount: number; foodId: string };

type SaveMealLog = {
  aiEstimate?: AiMealEstimate | null;
  comment?: string | null;
  date: string;
  eatenItems?: ChosenFood[];
  mealKey: string;
  mealName: string;
  photoPath?: string | null;
  planId: string;
  status: NutritionMealStatus;
};

function daySummary(
  plans: Array<{ content: unknown; createdAt: Date; type: 'ESTRUCTURADO' | 'LIBRE' }>,
  logs: MealLogView[],
  date: string,
): AdherenceDay {
  const expected = plans.reduce((sum, plan) => sum + plannedMeals(plan, date), 0);
  const dayLogs = logs.filter((log) => log.date === date);
  return {
    date,
    meals: dayLogs.map(toAdherenceMeal),
    ...countAdherence(
      expected,
      dayLogs.map((log) => log.status),
    ),
  };
}

function plannedMeals(plan: { content: unknown; createdAt: Date; type: 'ESTRUCTURADO' | 'LIBRE' }, date: string): number {
  const day = resolvePlanDay({ content: plan.content, type: plan.type }, plan.createdAt, planCalendarDate(date));
  return expectedMealsOnDate(plan.createdAt, date, day.meals.length);
}

function toAdherenceMeal(log: MealLogView): AdherenceMeal {
  return {
    aiEstimate: log.aiEstimate,
    comment: log.comment,
    eatenItems: log.eatenItems,
    mealKey: log.mealKey,
    mealName: log.mealName,
    photoUrl: log.photoUrl,
    status: log.status,
  };
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
  return { date: days[0]?.date ?? '', meals: [], ...countAdherence(totals.expected, repeatStatuses(totals)) };
}

function repeatStatuses(totals: { changed: number; done: number; skipped: number }) {
  return [
    ...Array<NutritionMealStatus>(totals.done).fill('DONE'),
    ...Array<NutritionMealStatus>(totals.changed).fill('CHANGED'),
    ...Array<NutritionMealStatus>(totals.skipped).fill('SKIPPED'),
  ];
}

function signPhoto(signer: PrivateMediaUrlSigner, path: string | null): string | null {
  if (!path) return null;
  try {
    return signer.sign(path);
  } catch {
    return null;
  }
}

function readEatenItems(value: Prisma.JsonValue | null): EatenItemView[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const row = item as Partial<EatenItemView>;
    if (!row.foodId || !row.name || typeof row.amount !== 'number') return [];
    return [
      {
        amount: row.amount,
        caloriesKcal: row.caloriesKcal ?? 0,
        carbsG: row.carbsG ?? 0,
        fatG: row.fatG ?? 0,
        foodId: row.foodId,
        name: row.name,
        proteinG: row.proteinG ?? 0,
        servingUnit: row.servingUnit ?? null,
      },
    ];
  });
}

function readAiEstimate(value: Prisma.JsonValue | null | undefined): AiMealEstimate | null {
  const parsed = aiEstimateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function toFoodItem(food: {
  caloriesKcal: number | null;
  carbsG: number | null;
  fatG: number | null;
  id: string;
  name: string;
  proteinG: number | null;
  servingUnit: string | null;
}) {
  return {
    caloriesKcal: food.caloriesKcal,
    carbsG: food.carbsG,
    fatG: food.fatG,
    foodId: food.id,
    name: food.name,
    proteinG: food.proteinG,
    servingUnit: food.servingUnit,
  };
}
