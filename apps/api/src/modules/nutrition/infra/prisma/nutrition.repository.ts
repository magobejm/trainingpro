import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  LibraryItemScope,
  NutritionPlanType,
  Prisma,
  type Meal,
  type MealIngredient,
  type NutritionPlan,
  type NutritionPlanCheckpoint,
} from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LibraryBaseRepository } from '../../../library/infra/prisma/library-base.repository';
import { LibraryEditPolicy } from '../../../library/domain/policies/library-edit.policy';
import { toDomainScope } from '../../../library/infra/prisma/library.repository.prisma.helpers';

export type FoodSnapshotRow = {
  caloriesKcal: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: Prisma.Decimal | null;
  id: string;
  micronutrients: string[];
  name: string;
  proteinG: number | null;
  saltG: Prisma.Decimal | null;
  saturatedFatG: Prisma.Decimal | null;
  servingUnit: string | null;
  sugarG: Prisma.Decimal | null;
  unsaturatedFatG: Prisma.Decimal | null;
};

type MealIngredientRow = MealIngredient & {
  food: FoodSnapshotRow;
};

type MealRow = Meal & {
  ingredients: MealIngredientRow[];
};

type CheckpointRow = NutritionPlanCheckpoint;

type PlanRow = NutritionPlan & {
  checkpoints: CheckpointRow[];
};

export type MealIngredientInput = {
  amountGrams: number;
  foodId: string;
  sortOrder?: number;
};

export type MealWriteInput = {
  category: string;
  ingredients?: MealIngredientInput[];
  name: string;
  notes?: null | string;
};

export type PlanWriteInput = {
  content?: Prisma.InputJsonValue;
  description?: null | string;
  name: string;
  setupData?: Prisma.InputJsonValue;
  strategy?: null | string;
  type: NutritionPlanType;
};

export type CheckpointWriteInput = {
  content?: Prisma.InputJsonValue;
  endDate?: Date | null;
  note?: null | string;
  planName?: null | string;
  setupData?: Prisma.InputJsonValue;
  startDate?: Date | null;
};

const MEAL_INCLUDE = {
  ingredients: {
    include: {
      food: {
        select: {
          caloriesKcal: true,
          carbsG: true,
          fatG: true,
          fiberG: true,
          id: true,
          micronutrients: true,
          name: true,
          proteinG: true,
          saltG: true,
          saturatedFatG: true,
          servingUnit: true,
          sugarG: true,
          unsaturatedFatG: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.MealInclude;

const PLAN_INCLUDE = {
  checkpoints: {
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.NutritionPlanInclude;

@Injectable()
export class NutritionRepository extends LibraryBaseRepository {
  constructor(
    private readonly policy: LibraryEditPolicy,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  async listMeals(context: AuthContext): Promise<MealRow[]> {
    const membership = await this.resolveCoachMembership(context);
    return this.prisma.meal.findMany({
      include: MEAL_INCLUDE,
      orderBy: [{ name: 'asc' }],
      where: {
        archivedAt: null,
        coachMembershipId: membership.id,
        scope: LibraryItemScope.COACH,
      },
    });
  }

  async createMeal(context: AuthContext, input: MealWriteInput): Promise<MealRow> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertFoodsExist(input.ingredients ?? []);
    return this.prisma.$transaction(async (tx) => {
      const meal = await tx.meal.create({
        data: {
          ...buildCreateAuditFields(context),
          category: input.category.trim(),
          coachMembershipId: membership.id,
          name: input.name.trim(),
          notes: input.notes?.trim() ?? null,
          organizationId: membership.organizationId,
          scope: LibraryItemScope.COACH,
        },
      });
      await this.replaceMealIngredients(tx, meal.id, input.ingredients ?? []);
      return tx.meal.findFirstOrThrow({
        include: MEAL_INCLUDE,
        where: { id: meal.id },
      });
    });
  }

  async updateMeal(context: AuthContext, mealId: string, input: Partial<MealWriteInput>): Promise<MealRow> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertMealOwned(mealId, membership.id);
    if (input.ingredients) {
      await this.assertFoodsExist(input.ingredients);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.meal.update({
        data: {
          ...buildUpdateAuditFields(context),
          ...(input.category !== undefined ? { category: input.category.trim() } : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.notes !== undefined ? { notes: input.notes?.trim() ?? null } : {}),
        },
        where: { id: mealId },
      });
      if (input.ingredients) {
        await this.replaceMealIngredients(tx, mealId, input.ingredients);
      }
      return tx.meal.findFirstOrThrow({
        include: MEAL_INCLUDE,
        where: { id: mealId },
      });
    });
  }

  async deleteMeal(context: AuthContext, mealId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertMealOwned(mealId, membership.id);
    await this.prisma.meal.update({
      data: {
        ...buildUpdateAuditFields(context),
        archivedAt: new Date(),
      },
      where: { id: mealId },
    });
  }

  async listPlans(context: AuthContext): Promise<PlanRow[]> {
    const membership = await this.resolveCoachMembership(context);
    return this.prisma.nutritionPlan.findMany({
      include: PLAN_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }],
      where: {
        archivedAt: null,
        clientId: null,
        coachMembershipId: membership.id,
        scope: LibraryItemScope.COACH,
      },
    });
  }

  async createPlan(context: AuthContext, input: PlanWriteInput): Promise<PlanRow> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.nutritionPlan.create({
      data: {
        ...buildCreateAuditFields(context),
        clientId: null,
        coachMembershipId: membership.id,
        content: snapshotJson(input.content) ?? Prisma.JsonNull,
        description: input.description?.trim() ?? null,
        name: input.name.trim(),
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
        setupData: snapshotJson(input.setupData) ?? Prisma.JsonNull,
        strategy: input.strategy?.trim() ?? null,
        type: input.type,
      },
      include: PLAN_INCLUDE,
    });
    return row;
  }

  async updatePlan(context: AuthContext, planId: string, input: Partial<PlanWriteInput>): Promise<PlanRow> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertPlanOwned(planId, membership.id);
    const row = await this.prisma.nutritionPlan.update({
      data: {
        ...buildUpdateAuditFields(context),
        ...(input.content !== undefined ? { content: snapshotJson(input.content) ?? Prisma.JsonNull } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() ?? null } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.setupData !== undefined ? { setupData: snapshotJson(input.setupData) ?? Prisma.JsonNull } : {}),
        ...(input.strategy !== undefined ? { strategy: input.strategy?.trim() ?? null } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
      },
      include: PLAN_INCLUDE,
      where: { id: planId },
    });
    return row;
  }

  async deletePlan(context: AuthContext, planId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertPlanOwned(planId, membership.id);
    await this.prisma.nutritionPlan.update({
      data: {
        ...buildUpdateAuditFields(context),
        archivedAt: new Date(),
      },
      where: { id: planId },
    });
  }

  async assignPlan(context: AuthContext, planId: string, clientId: string): Promise<PlanRow> {
    const membership = await this.resolveCoachMembership(context);
    const source = await this.assertPlanOwned(planId, membership.id);
    if (source.clientId) {
      throw new BadRequestException('Only library plans can be assigned to a client');
    }
    await this.assertCoachClient(membership.id, clientId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.nutritionPlan.findFirst({
          select: { id: true },
          where: {
            archivedAt: null,
            clientId,
            coachMembershipId: membership.id,
            type: source.type,
          },
        });
        if (existing) {
          await tx.nutritionPlan.update({
            data: {
              ...buildUpdateAuditFields(context),
              archivedAt: new Date(),
            },
            where: { id: existing.id },
          });
        }
        return tx.nutritionPlan.create({
          data: {
            ...buildCreateAuditFields(context),
            clientId,
            coachMembershipId: membership.id,
            content: snapshotJson(source.content) ?? Prisma.JsonNull,
            description: source.description,
            name: source.name,
            organizationId: membership.organizationId,
            scope: LibraryItemScope.COACH,
            setupData: snapshotJson(source.setupData) ?? Prisma.JsonNull,
            sourcePlanId: source.id,
            strategy: source.strategy,
            type: source.type,
          },
          include: PLAN_INCLUDE,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Client already has an active plan of this type');
      }
      throw error;
    }
  }

  async listPlansByClient(context: AuthContext, clientId: string): Promise<PlanRow[]> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertCoachClient(membership.id, clientId);
    return this.prisma.nutritionPlan.findMany({
      include: PLAN_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }],
      where: {
        archivedAt: null,
        clientId,
        coachMembershipId: membership.id,
      },
    });
  }

  async listCheckpoints(context: AuthContext, planId: string): Promise<CheckpointRow[]> {
    const membership = await this.resolveCoachMembership(context);
    await this.assertPlanOwned(planId, membership.id);
    return this.prisma.nutritionPlanCheckpoint.findMany({
      orderBy: [{ createdAt: 'desc' }],
      where: { planId },
    });
  }

  async createCheckpoint(context: AuthContext, planId: string, input: CheckpointWriteInput): Promise<CheckpointRow> {
    const membership = await this.resolveCoachMembership(context);
    const plan = await this.assertPlanOwned(planId, membership.id);
    return this.prisma.nutritionPlanCheckpoint.create({
      data: {
        content: snapshotJson(input.content) ?? snapshotJson(plan.content) ?? Prisma.JsonNull,
        endDate: input.endDate ?? null,
        note: input.note?.trim() ?? null,
        planId,
        planName: input.planName?.trim() ?? plan.name,
        setupData: snapshotJson(input.setupData) ?? snapshotJson(plan.setupData) ?? Prisma.JsonNull,
        startDate: input.startDate ?? null,
      },
    });
  }

  async getClientAssignedPlans(context: AuthContext): Promise<PlanRow[]> {
    const client = await this.resolveClient(context);
    return this.prisma.nutritionPlan.findMany({
      include: PLAN_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }],
      where: {
        archivedAt: null,
        clientId: client.id,
      },
    });
  }

  async listMealsByIds(ids: string[]): Promise<MealRow[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.meal.findMany({
      include: MEAL_INCLUDE,
      where: { archivedAt: null, id: { in: ids } },
    });
  }

  async listFoodsByIds(ids: string[]): Promise<FoodSnapshotRow[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.food.findMany({
      select: {
        caloriesKcal: true,
        carbsG: true,
        fatG: true,
        fiberG: true,
        id: true,
        micronutrients: true,
        name: true,
        proteinG: true,
        saltG: true,
        saturatedFatG: true,
        servingUnit: true,
        sugarG: true,
        unsaturatedFatG: true,
      },
      where: { archivedAt: null, id: { in: ids } },
    });
  }

  private async resolveClient(context: AuthContext) {
    const email = context.email;
    if (!email) {
      throw new NotFoundException('Client profile not found');
    }
    const client = await this.prisma.client.findFirst({
      select: { id: true },
      where: { archivedAt: null, email },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return client;
  }

  private async assertMealOwned(mealId: string, coachMembershipId: string) {
    const row = await this.prisma.meal.findFirst({
      select: { coachMembershipId: true, scope: true },
      where: { archivedAt: null, id: mealId },
    });
    if (!row) {
      throw new NotFoundException('Meal not found');
    }
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, coachMembershipId);
    return row;
  }

  private async assertPlanOwned(planId: string, coachMembershipId: string) {
    const row = await this.prisma.nutritionPlan.findFirst({
      select: {
        clientId: true,
        coachMembershipId: true,
        content: true,
        description: true,
        id: true,
        name: true,
        scope: true,
        setupData: true,
        strategy: true,
        type: true,
      },
      where: { archivedAt: null, id: planId },
    });
    if (!row) {
      throw new NotFoundException('Nutrition plan not found');
    }
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, coachMembershipId);
    return row;
  }

  private async assertCoachClient(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      select: { id: true },
      where: { archivedAt: null, coachMembershipId, id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found for current coach');
    }
  }

  private async assertFoodsExist(ingredients: MealIngredientInput[]): Promise<void> {
    if (ingredients.length === 0) {
      return;
    }
    const foodIds = [...new Set(ingredients.map((item) => item.foodId))];
    const count = await this.prisma.food.count({
      where: { archivedAt: null, id: { in: foodIds } },
    });
    if (count !== foodIds.length) {
      throw new NotFoundException('One or more foods were not found');
    }
  }

  private async replaceMealIngredients(
    tx: Prisma.TransactionClient,
    mealId: string,
    ingredients: MealIngredientInput[],
  ): Promise<void> {
    await tx.mealIngredient.deleteMany({ where: { mealId } });
    if (ingredients.length === 0) {
      return;
    }
    await tx.mealIngredient.createMany({
      data: ingredients.map((ingredient, index) => ({
        amountGrams: ingredient.amountGrams,
        foodId: ingredient.foodId,
        mealId,
        sortOrder: ingredient.sortOrder ?? index,
      })),
    });
  }
}

function snapshotJson(value: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
