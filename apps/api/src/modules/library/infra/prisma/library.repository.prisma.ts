import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LibraryItemScope, Role } from '@prisma/client';
import {
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CardioMethodFilter,
  CardioMethodWriteInput,
} from '../../domain/cardio-method.input';
import type { ExerciseFilter, ExerciseWriteInput } from '../../domain/exercise.input';
import type { FoodFilter, FoodWriteInput } from '../../domain/food.input';
import type { LibraryRepositoryPort } from '../../domain/library-repository.port';
import { LibraryEditPolicy } from '../../domain/policies/library-edit.policy';
import {
  mapCardioMethod,
  mapCatalogItem,
  mapExercise,
  mapFood,
  normalizeCardioMethodInput,
  normalizeExerciseInput,
  normalizeFoodInput,
} from './library.mappers';
import {
  assertCatalogExists,
  buildCardioMethodWhere,
  buildExerciseWhere,
  buildFoodWhere,
  toDomainScope,
} from './library.repository.prisma.helpers';

type CoachMembership = {
  id: string;
  organizationId: string;
};

const CARDIO_METHOD_WITH_CATALOG = {
  methodTypeRef: { select: { label: true } },
} as const;

const EXERCISE_WITH_CATALOG = {
  muscleGroupRef: { select: { label: true } },
} as const;

@Injectable()
export class LibraryRepositoryPrisma implements LibraryRepositoryPort {
  constructor(
    private readonly policy: LibraryEditPolicy,
    private readonly prisma: PrismaService,
  ) {}

  async createCardioMethod(context: AuthContext, input: CardioMethodWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    await this.assertCardioMethodTypeExists(input.methodTypeId);
    const row = await this.prisma.cardioMethod.create({
      data: {
        ...buildCreateAuditFields(context),
        ...normalizeCardioMethodInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
      include: CARDIO_METHOD_WITH_CATALOG,
    });
    return mapCardioMethod(row);
  }

  async createExercise(context: AuthContext, input: ExerciseWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    await this.assertExerciseMuscleGroupExists(input.muscleGroupId);
    const row = await this.prisma.exercise.create({
      data: {
        ...buildCreateAuditFields(context),
        ...normalizeExerciseInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
      include: EXERCISE_WITH_CATALOG,
    });
    return mapExercise(row);
  }

  async createFood(context: AuthContext, input: FoodWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.prisma.food.create({
      data: {
        ...buildCreateAuditFields(context),
        ...normalizeFoodInput(input),
        coachMembershipId: membership.id,
        organizationId: membership.organizationId,
        scope: LibraryItemScope.COACH,
      },
    });
    return mapFood(row);
  }

  async deleteCardioMethod(context: AuthContext, itemId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readCardioMethodForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.cardioMethod.update({
      where: { id: itemId },
      data: {
        ...buildUpdateAuditFields(context),
        archivedAt: new Date(),
      },
    });
  }

  async deleteExercise(context: AuthContext, itemId: string): Promise<void> {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    await this.prisma.exercise.update({
      where: { id: itemId },
      data: {
        ...buildUpdateAuditFields(context),
        archivedAt: new Date(),
      },
    });
  }

  async listCardioMethodTypes() {
    const rows = await this.prisma.cardioMethodType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: { id: true, isDefault: true, label: true },
    });
    return rows.map(mapCatalogItem);
  }

  async listCardioMethods(context: AuthContext, filter: CardioMethodFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.cardioMethod.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      where: buildCardioMethodWhere(membership.id, filter),
      include: CARDIO_METHOD_WITH_CATALOG,
    });
    return rows.map(mapCardioMethod);
  }

  async listExerciseMuscleGroups() {
    const rows = await this.prisma.exerciseMuscleGroup.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: { id: true, isDefault: true, label: true },
    });
    return rows.map(mapCatalogItem);
  }

  async listExercises(context: AuthContext, filter: ExerciseFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.exercise.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      where: buildExerciseWhere(membership.id, filter),
      include: EXERCISE_WITH_CATALOG,
    });
    return rows.map(mapExercise);
  }

  async listFoods(context: AuthContext, filter: FoodFilter) {
    const membership = await this.resolveCoachMembership(context);
    const rows = await this.prisma.food.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      where: buildFoodWhere(membership.id, filter),
    });
    return rows.map(mapFood);
  }

  async updateCardioMethod(
    context: AuthContext,
    itemId: string,
    input: CardioMethodWriteInput,
  ) {
    const membership = await this.resolveCoachMembership(context);
    await this.assertCardioMethodTypeExists(input.methodTypeId);
    const row = await this.readCardioMethodForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.cardioMethod.update({
      where: { id: itemId },
      data: { ...buildUpdateAuditFields(context), ...normalizeCardioMethodInput(input) },
      include: CARDIO_METHOD_WITH_CATALOG,
    });
    return mapCardioMethod(updated);
  }

  async updateExercise(context: AuthContext, itemId: string, input: ExerciseWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    await this.assertExerciseMuscleGroupExists(input.muscleGroupId);
    const row = await this.readExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.exercise.update({
      where: { id: itemId },
      data: { ...buildUpdateAuditFields(context), ...normalizeExerciseInput(input) },
      include: EXERCISE_WITH_CATALOG,
    });
    return mapExercise(updated);
  }

  async updateFood(context: AuthContext, itemId: string, input: FoodWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readFoodForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.food.update({
      where: { id: itemId },
      data: { ...buildUpdateAuditFields(context), ...normalizeFoodInput(input) },
    });
    return mapFood(updated);
  }

  private async assertCardioMethodTypeExists(methodTypeId: string): Promise<void> {
    await assertCatalogExists(
      () => this.prisma.cardioMethodType.findUnique({ where: { id: methodTypeId } }),
      'Cardio method type not found',
    );
  }

  private async assertExerciseMuscleGroupExists(muscleGroupId: string): Promise<void> {
    await assertCatalogExists(
      () => this.prisma.exerciseMuscleGroup.findUnique({ where: { id: muscleGroupId } }),
      'Exercise muscle group not found',
    );
  }

  private async readCardioMethodForUpdate(itemId: string) {
    const row = await this.prisma.cardioMethod.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Cardio method not found');
    }
    return row;
  }

  private async readExerciseForUpdate(itemId: string) {
    const row = await this.prisma.exercise.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Exercise not found');
    }
    return row;
  }

  private async readFoodForUpdate(itemId: string) {
    const row = await this.prisma.food.findFirst({
      where: { archivedAt: null, id: itemId },
      select: { coachMembershipId: true, scope: true },
    });
    if (!row) {
      throw new NotFoundException('Food not found');
    }
    return row;
  }

  private async resolveCoachMembership(context: AuthContext): Promise<CoachMembership> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: context.subject },
      },
      select: { id: true, organizationId: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }
}
