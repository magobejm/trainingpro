import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { NutritionPlanType, Prisma } from '@prisma/client';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { NutritionService } from '../../application/nutrition.service';
import { AssignPlanDto } from '../dto/assign-plan.dto';
import { ClientIdParamDto } from '../dto/client-id-param.dto';
import { CreateCheckpointDto } from '../dto/create-checkpoint.dto';
import { CreateMealDto } from '../dto/create-meal.dto';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { MealIdParamDto } from '../dto/meal-id-param.dto';
import { PlanIdParamDto } from '../dto/plan-id-param.dto';
import { UpdateMealDto } from '../dto/update-meal.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';

@Controller('nutrition')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('meals')
  async listMeals(@Req() request: HttpAuthRequest) {
    const items = await this.nutritionService.listMeals(readAuthContext(request));
    return { items };
  }

  @Post('meals')
  async createMeal(@Body() body: CreateMealDto, @Req() request: HttpAuthRequest) {
    return this.nutritionService.createMeal(readAuthContext(request), body);
  }

  @Patch('meals/:mealId')
  async updateMeal(@Param() params: MealIdParamDto, @Body() body: UpdateMealDto, @Req() request: HttpAuthRequest) {
    return this.nutritionService.updateMeal(readAuthContext(request), params.mealId, body);
  }

  @Delete('meals/:mealId')
  async deleteMeal(@Param() params: MealIdParamDto, @Req() request: HttpAuthRequest) {
    await this.nutritionService.deleteMeal(readAuthContext(request), params.mealId);
    return { status: 'ok' };
  }

  @Get('plans')
  async listPlans(@Req() request: HttpAuthRequest) {
    const items = await this.nutritionService.listPlans(readAuthContext(request));
    return { items };
  }

  @Post('plans')
  async createPlan(@Body() body: CreatePlanDto, @Req() request: HttpAuthRequest) {
    return this.nutritionService.createPlan(readAuthContext(request), {
      content: toJsonValue(body.content),
      description: body.description,
      name: body.name,
      setupData: toJsonValue(body.setupData),
      strategy: body.strategy,
      type: body.type as NutritionPlanType,
    });
  }

  @Patch('plans/:planId')
  async updatePlan(@Param() params: PlanIdParamDto, @Body() body: UpdatePlanDto, @Req() request: HttpAuthRequest) {
    return this.nutritionService.updatePlan(readAuthContext(request), params.planId, mapPlanPatch(body));
  }

  @Delete('plans/:planId')
  async deletePlan(@Param() params: PlanIdParamDto, @Req() request: HttpAuthRequest) {
    await this.nutritionService.deletePlan(readAuthContext(request), params.planId);
    return { status: 'ok' };
  }

  @Post('plans/:planId/assign')
  async assignPlan(@Param() params: PlanIdParamDto, @Body() body: AssignPlanDto, @Req() request: HttpAuthRequest) {
    return this.nutritionService.assignPlan(readAuthContext(request), params.planId, body.clientId);
  }

  @Get('clients/:clientId/plans')
  async listClientPlans(@Param() params: ClientIdParamDto, @Req() request: HttpAuthRequest) {
    const items = await this.nutritionService.listPlansByClient(readAuthContext(request), params.clientId);
    return { items };
  }

  @Get('plans/:planId/checkpoints')
  async listCheckpoints(@Param() params: PlanIdParamDto, @Req() request: HttpAuthRequest) {
    const items = await this.nutritionService.listCheckpoints(readAuthContext(request), params.planId);
    return { items };
  }

  @Post('plans/:planId/checkpoints')
  async createCheckpoint(
    @Param() params: PlanIdParamDto,
    @Body() body: CreateCheckpointDto,
    @Req() request: HttpAuthRequest,
  ) {
    return this.nutritionService.createCheckpoint(readAuthContext(request), params.planId, {
      content: toJsonValue(body.content),
      endDate: parseOptionalDate(body.endDate),
      note: body.note,
      planName: body.planName,
      setupData: toJsonValue(body.setupData),
      startDate: parseOptionalDate(body.startDate),
    });
  }
}

function parseOptionalDate(value: null | string | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Date(value);
}

function mapPlanPatch(body: UpdatePlanDto) {
  return {
    ...(body.content !== undefined ? { content: toJsonValue(body.content) } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.setupData !== undefined ? { setupData: toJsonValue(body.setupData) } : {}),
    ...(body.strategy !== undefined ? { strategy: body.strategy } : {}),
    ...(body.type !== undefined ? { type: body.type as NutritionPlanType } : {}),
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}
