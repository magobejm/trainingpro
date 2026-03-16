import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { CardioMethodFilter, CardioMethodWriteInput } from '../../domain/cardio-method.input';
import type { ExerciseFilter, ExerciseWriteInput } from '../../domain/exercise.input';
import type { FoodFilter, FoodWriteInput } from '../../domain/food.input';
import type { IsometricExerciseFilter, IsometricExerciseWriteInput } from '../../domain/isometric-exercise.input';
import type { PlioExerciseFilter, PlioExerciseWriteInput } from '../../domain/plio-exercise.input';
import type { MobilityExerciseFilter, MobilityExerciseWriteInput } from '../../domain/mobility-exercise.input';
import type { SportWriteInput } from '../../domain/sport.input';
import type { LibraryRepositoryPort } from '../../domain/library-repository.port';
import { LibraryEditPolicy } from '../../domain/policies/library-edit.policy';
import {
  mapCardioMethod,
  mapCatalogItem,
  mapExercise,
  normalizeCardioMethodInput,
  normalizeExerciseInput,
} from './library.mappers';
import {
  assertCatalogExists,
  buildCardioMethodWhere,
  buildExerciseWhere,
  toDomainScope,
} from './library.repository.prisma.helpers';
import { LibraryBaseRepository } from './library-base.repository';
import { LibraryFoodRepository } from './library-food.repository';
import { LibrarySpecializedRepository } from './library-specialized.repository';

const CARDIO_METHOD_WITH_CATALOG = {
  methodTypeRef: { select: { label: true } },
} as const;

const EXERCISE_WITH_CATALOG = {
  muscleGroups: { include: { muscleGroup: { select: { id: true, label: true } } } },
} as const;

@Injectable()
export class LibraryRepositoryPrisma extends LibraryBaseRepository implements LibraryRepositoryPort {
  constructor(
    private readonly policy: LibraryEditPolicy,
    prisma: PrismaService,
    private readonly foodRepo: LibraryFoodRepository,
    private readonly specializedRepo: LibrarySpecializedRepository,
  ) {
    super(prisma);
  }

  async createCardioMethod(context: AuthContext, input: CardioMethodWriteInput) {
    const membership = await this.resolveCoachMembership(context);
    const methodTypeId = input.methodTypeId ?? await this.resolveDefaultCardioMethodTypeId();
    await this.assertCardioMethodTypeExists(methodTypeId);
    const row = await this.prisma.cardioMethod.create({
      data: {
        ...buildCreateAuditFields(context),
        ...normalizeCardioMethodInput(input),
        methodTypeId,
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
    return this.foodRepo.createFood(context, input);
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

  async deleteFood(context: AuthContext, itemId: string): Promise<void> {
    return this.foodRepo.deleteFood(context, itemId);
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
      orderBy: [{ name: 'asc' }],
      where: buildCardioMethodWhere(membership.id, filter),
      include: CARDIO_METHOD_WITH_CATALOG,
    });
    return rows.map(mapCardioMethod);
  }

  async listMobilityTypes(context: AuthContext) {
    return this.specializedRepo.listMobilityTypes(context);
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
      orderBy: [{ name: 'asc' }],
      where: buildExerciseWhere(membership.id, filter),
      include: EXERCISE_WITH_CATALOG,
    });
    return rows.map(mapExercise);
  }

  async listFoods(context: AuthContext, filter: FoodFilter) {
    return this.foodRepo.listFoods(context, filter);
  }

  async listIsometricExercises(context: AuthContext, filter: IsometricExerciseFilter) {
    return this.specializedRepo.listIsometricExercises(context, filter);
  }

  async listIsometricTypes(context: AuthContext) {
    return this.specializedRepo.listIsometricTypes(context);
  }

  async createIsometricExercise(context: AuthContext, input: IsometricExerciseWriteInput) {
    return this.specializedRepo.createIsometricExercise(context, input);
  }

  async updateIsometricExercise(context: AuthContext, itemId: string, input: Partial<IsometricExerciseWriteInput>) {
    return this.specializedRepo.updateIsometricExercise(context, itemId, input);
  }

  async deleteIsometricExercise(context: AuthContext, itemId: string) {
    return this.specializedRepo.deleteIsometricExercise(context, itemId);
  }

  async listPlioExercises(context: AuthContext, filter: PlioExerciseFilter) {
    return this.specializedRepo.listPlioExercises(context, filter);
  }

  async listPlioTypes(context: AuthContext) {
    return this.specializedRepo.listPlioTypes(context);
  }

  async listMobilityExercises(context: AuthContext, filter: MobilityExerciseFilter) {
    return this.specializedRepo.listMobilityExercises(context, filter);
  }

  async listSports(context: AuthContext, query?: string) {
    return this.specializedRepo.listSports(context, query);
  }

  async createPlioExercise(context: AuthContext, input: PlioExerciseWriteInput) {
    return this.specializedRepo.createPlioExercise(context, input);
  }

  async createMobilityExercise(context: AuthContext, input: MobilityExerciseWriteInput) {
    return this.specializedRepo.createMobilityExercise(context, input);
  }

  async createSport(context: AuthContext, input: SportWriteInput) {
    return this.specializedRepo.createSport(context, input);
  }

  async updatePlioExercise(context: AuthContext, itemId: string, input: Partial<PlioExerciseWriteInput>) {
    return this.specializedRepo.updatePlioExercise(context, itemId, input);
  }

  async updateMobilityExercise(context: AuthContext, itemId: string, input: Partial<MobilityExerciseWriteInput>) {
    return this.specializedRepo.updateMobilityExercise(context, itemId, input);
  }

  async updateSport(context: AuthContext, itemId: string, input: Partial<SportWriteInput>) {
    return this.specializedRepo.updateSport(context, itemId, input);
  }

  async deletePlioExercise(context: AuthContext, itemId: string) {
    return this.specializedRepo.deletePlioExercise(context, itemId);
  }

  async deleteMobilityExercise(context: AuthContext, itemId: string) {
    return this.specializedRepo.deleteMobilityExercise(context, itemId);
  }

  async deleteSport(context: AuthContext, itemId: string) {
    return this.specializedRepo.deleteSport(context, itemId);
  }

  async updateCardioMethod(context: AuthContext, itemId: string, input: Partial<CardioMethodWriteInput>) {
    const membership = await this.resolveCoachMembership(context);
    if (input.methodTypeId) {
      await this.assertCardioMethodTypeExists(input.methodTypeId);
    }
    const row = await this.readCardioMethodForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.cardioMethod.update({
      where: { id: itemId },
      data: { ...buildUpdateAuditFields(context), ...normalizeCardioMethodInput(input) },
      include: CARDIO_METHOD_WITH_CATALOG,
    });
    return mapCardioMethod(updated);
  }

  async updateExercise(context: AuthContext, itemId: string, input: Partial<ExerciseWriteInput>) {
    const membership = await this.resolveCoachMembership(context);
    const row = await this.readExerciseForUpdate(itemId);
    this.policy.assertCoachOwned(toDomainScope(row.scope), row.coachMembershipId, membership.id);
    const updated = await this.prisma.exercise.update({
      where: { id: itemId },
      data: { ...buildUpdateAuditFields(context), ...normalizeExerciseInput(input) },
      include: EXERCISE_WITH_CATALOG,
    });
    return mapExercise(updated);
  }

  async updateFood(context: AuthContext, itemId: string, input: Partial<FoodWriteInput>) {
    return this.foodRepo.updateFood(context, itemId, input);
  }

  private async resolveDefaultCardioMethodTypeId(): Promise<string> {
    const row = await this.prisma.cardioMethodType.findFirst({ where: { isDefault: true } });
    if (!row) {
      throw new Error('No default cardio method type found');
    }
    return row.id;
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
}
