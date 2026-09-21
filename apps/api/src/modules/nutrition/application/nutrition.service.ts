import { Injectable } from '@nestjs/common';
import { NutritionPlanType, Prisma } from '@prisma/client';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import {
  CheckpointWriteInput,
  MealWriteInput,
  NutritionRepository,
  PlanWriteInput,
} from '../infra/prisma/nutrition.repository';
import {
  collectPlanRefIds,
  mapFoodConsideration,
  mapMeal,
  type FoodConsiderationOutput,
  type MealOutput,
} from './nutrition-meal.mapper';

export type {
  FoodConsiderationOutput,
  MealFoodSnapshotOutput,
  MealIngredientOutput,
  MealOutput,
} from './nutrition-meal.mapper';

export type CheckpointOutput = {
  content: Prisma.JsonValue;
  createdAt: string;
  endDate: string | null;
  id: string;
  note: string | null;
  planId: string;
  planName: string | null;
  setupData: Prisma.JsonValue;
  startDate: string | null;
};

export type PlanOutput = {
  checkpoints: CheckpointOutput[];
  clientId: string | null;
  content: Prisma.JsonValue;
  description: string | null;
  id: string;
  name: string;
  setupData: Prisma.JsonValue;
  sourcePlanId: string | null;
  strategy: string | null;
  type: NutritionPlanType;
};

export type ClientNutritionOutput = {
  estructuradoPlan?: PlanOutput;
  foods: FoodConsiderationOutput[];
  librePlan?: PlanOutput;
  meals: MealOutput[];
};

@Injectable()
export class NutritionService {
  constructor(private readonly repository: NutritionRepository) {}

  async listMeals(context: AuthContext): Promise<MealOutput[]> {
    const rows = await this.repository.listMeals(context);
    return rows.map(mapMeal);
  }

  async createMeal(context: AuthContext, input: MealWriteInput): Promise<MealOutput> {
    const row = await this.repository.createMeal(context, input);
    return mapMeal(row);
  }

  async updateMeal(context: AuthContext, mealId: string, input: Partial<MealWriteInput>): Promise<MealOutput> {
    const row = await this.repository.updateMeal(context, mealId, input);
    return mapMeal(row);
  }

  async deleteMeal(context: AuthContext, mealId: string): Promise<void> {
    await this.repository.deleteMeal(context, mealId);
  }

  async listPlans(context: AuthContext): Promise<PlanOutput[]> {
    const rows = await this.repository.listPlans(context);
    return rows.map(mapPlan);
  }

  async createPlan(context: AuthContext, input: PlanWriteInput): Promise<PlanOutput> {
    const row = await this.repository.createPlan(context, input);
    return mapPlan(row);
  }

  async updatePlan(context: AuthContext, planId: string, input: Partial<PlanWriteInput>): Promise<PlanOutput> {
    const row = await this.repository.updatePlan(context, planId, input);
    return mapPlan(row);
  }

  async deletePlan(context: AuthContext, planId: string): Promise<void> {
    await this.repository.deletePlan(context, planId);
  }

  async assignPlan(context: AuthContext, planId: string, clientId: string): Promise<PlanOutput> {
    const row = await this.repository.assignPlan(context, planId, clientId);
    return mapPlan(row);
  }

  async listPlansByClient(context: AuthContext, clientId: string): Promise<PlanOutput[]> {
    const rows = await this.repository.listPlansByClient(context, clientId);
    return rows.map(mapPlan);
  }

  async listCheckpoints(context: AuthContext, planId: string): Promise<CheckpointOutput[]> {
    const rows = await this.repository.listCheckpoints(context, planId);
    return rows.map(mapCheckpoint);
  }

  async createCheckpoint(context: AuthContext, planId: string, input: CheckpointWriteInput): Promise<CheckpointOutput> {
    const row = await this.repository.createCheckpoint(context, planId, input);
    return mapCheckpoint(row);
  }

  async getClientNutrition(context: AuthContext): Promise<ClientNutritionOutput> {
    const rows = await this.repository.getClientAssignedPlans(context);
    const librePlan = rows.find((row) => row.type === NutritionPlanType.LIBRE);
    const estructuradoPlan = rows.find((row) => row.type === NutritionPlanType.ESTRUCTURADO);
    const refs = collectClientRefs(librePlan?.content, estructuradoPlan?.content);
    const [mealRows, foodRows] = await Promise.all([
      this.repository.listMealsByIds(refs.mealIds),
      this.repository.listFoodsByIds(refs.foodIds),
    ]);
    return {
      ...(librePlan ? { librePlan: mapPlan(librePlan) } : {}),
      ...(estructuradoPlan ? { estructuradoPlan: mapPlan(estructuradoPlan) } : {}),
      foods: foodRows.map(mapFoodConsideration),
      meals: mealRows.map(mapMeal),
    };
  }
}

function collectClientRefs(
  libreContent: Prisma.JsonValue | undefined,
  structuredContent: Prisma.JsonValue | undefined,
): { foodIds: string[]; mealIds: string[] } {
  const libre = collectPlanRefIds(libreContent);
  const structured = collectPlanRefIds(structuredContent);
  return {
    foodIds: [...new Set([...libre.foodIds, ...structured.foodIds])],
    mealIds: [...new Set([...libre.mealIds, ...structured.mealIds])],
  };
}

function mapPlan(row: {
  checkpoints: Array<{
    content: Prisma.JsonValue;
    createdAt: Date;
    endDate: Date | null;
    id: string;
    note: string | null;
    planId: string;
    planName: string | null;
    setupData: Prisma.JsonValue;
    startDate: Date | null;
  }>;
  clientId: string | null;
  content: Prisma.JsonValue;
  description: string | null;
  id: string;
  name: string;
  setupData: Prisma.JsonValue;
  sourcePlanId: string | null;
  strategy: string | null;
  type: NutritionPlanType;
}): PlanOutput {
  return {
    checkpoints: row.checkpoints.map(mapCheckpoint),
    clientId: row.clientId,
    content: row.content,
    description: row.description,
    id: row.id,
    name: row.name,
    setupData: row.setupData,
    sourcePlanId: row.sourcePlanId,
    strategy: row.strategy,
    type: row.type,
  };
}

function mapCheckpoint(row: {
  content: Prisma.JsonValue;
  createdAt: Date;
  endDate: Date | null;
  id: string;
  note: string | null;
  planId: string;
  planName: string | null;
  setupData: Prisma.JsonValue;
  startDate: Date | null;
}): CheckpointOutput {
  return {
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
    id: row.id,
    note: row.note,
    planId: row.planId,
    planName: row.planName,
    setupData: row.setupData,
    startDate: row.startDate ? row.startDate.toISOString() : null,
  };
}
