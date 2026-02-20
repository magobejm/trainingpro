"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const library_edit_policy_1 = require("../../domain/policies/library-edit.policy");
const library_mappers_1 = require("./library.mappers");
const library_repository_prisma_helpers_1 = require("./library.repository.prisma.helpers");
const CARDIO_METHOD_WITH_CATALOG = {
    methodTypeRef: { select: { label: true } },
};
const EXERCISE_WITH_CATALOG = {
    muscleGroupRef: { select: { label: true } },
};
let LibraryRepositoryPrisma = class LibraryRepositoryPrisma {
    policy;
    prisma;
    constructor(policy, prisma) {
        this.policy = policy;
        this.prisma = prisma;
    }
    async createCardioMethod(context, input) {
        const membership = await this.resolveCoachMembership(context);
        await this.assertCardioMethodTypeExists(input.methodTypeId);
        const row = await this.prisma.cardioMethod.create({
            data: {
                ...(0, audit_fields_1.buildCreateAuditFields)(context),
                ...(0, library_mappers_1.normalizeCardioMethodInput)(input),
                coachMembershipId: membership.id,
                organizationId: membership.organizationId,
                scope: client_1.LibraryItemScope.COACH,
            },
            include: CARDIO_METHOD_WITH_CATALOG,
        });
        return (0, library_mappers_1.mapCardioMethod)(row);
    }
    async createExercise(context, input) {
        const membership = await this.resolveCoachMembership(context);
        await this.assertExerciseMuscleGroupExists(input.muscleGroupId);
        const row = await this.prisma.exercise.create({
            data: {
                ...(0, audit_fields_1.buildCreateAuditFields)(context),
                ...(0, library_mappers_1.normalizeExerciseInput)(input),
                coachMembershipId: membership.id,
                organizationId: membership.organizationId,
                scope: client_1.LibraryItemScope.COACH,
            },
            include: EXERCISE_WITH_CATALOG,
        });
        return (0, library_mappers_1.mapExercise)(row);
    }
    async createFood(context, input) {
        const membership = await this.resolveCoachMembership(context);
        const row = await this.prisma.food.create({
            data: {
                ...(0, audit_fields_1.buildCreateAuditFields)(context),
                ...(0, library_mappers_1.normalizeFoodInput)(input),
                coachMembershipId: membership.id,
                organizationId: membership.organizationId,
                scope: client_1.LibraryItemScope.COACH,
            },
        });
        return (0, library_mappers_1.mapFood)(row);
    }
    async deleteCardioMethod(context, itemId) {
        const membership = await this.resolveCoachMembership(context);
        const row = await this.readCardioMethodForUpdate(itemId);
        this.policy.assertCoachOwned((0, library_repository_prisma_helpers_1.toDomainScope)(row.scope), row.coachMembershipId, membership.id);
        await this.prisma.cardioMethod.update({
            where: { id: itemId },
            data: {
                ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                archivedAt: new Date(),
            },
        });
    }
    async deleteExercise(context, itemId) {
        const membership = await this.resolveCoachMembership(context);
        const row = await this.readExerciseForUpdate(itemId);
        this.policy.assertCoachOwned((0, library_repository_prisma_helpers_1.toDomainScope)(row.scope), row.coachMembershipId, membership.id);
        await this.prisma.exercise.update({
            where: { id: itemId },
            data: {
                ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                archivedAt: new Date(),
            },
        });
    }
    async listCardioMethodTypes() {
        const rows = await this.prisma.cardioMethodType.findMany({
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            select: { id: true, isDefault: true, label: true },
        });
        return rows.map(library_mappers_1.mapCatalogItem);
    }
    async listCardioMethods(context, filter) {
        const membership = await this.resolveCoachMembership(context);
        const rows = await this.prisma.cardioMethod.findMany({
            orderBy: [{ scope: 'asc' }, { name: 'asc' }],
            where: (0, library_repository_prisma_helpers_1.buildCardioMethodWhere)(membership.id, filter),
            include: CARDIO_METHOD_WITH_CATALOG,
        });
        return rows.map(library_mappers_1.mapCardioMethod);
    }
    async listExerciseMuscleGroups() {
        const rows = await this.prisma.exerciseMuscleGroup.findMany({
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            select: { id: true, isDefault: true, label: true },
        });
        return rows.map(library_mappers_1.mapCatalogItem);
    }
    async listExercises(context, filter) {
        const membership = await this.resolveCoachMembership(context);
        const rows = await this.prisma.exercise.findMany({
            orderBy: [{ scope: 'asc' }, { name: 'asc' }],
            where: (0, library_repository_prisma_helpers_1.buildExerciseWhere)(membership.id, filter),
            include: EXERCISE_WITH_CATALOG,
        });
        return rows.map(library_mappers_1.mapExercise);
    }
    async listFoods(context, filter) {
        const membership = await this.resolveCoachMembership(context);
        const rows = await this.prisma.food.findMany({
            orderBy: [{ scope: 'asc' }, { name: 'asc' }],
            where: (0, library_repository_prisma_helpers_1.buildFoodWhere)(membership.id, filter),
        });
        return rows.map(library_mappers_1.mapFood);
    }
    async updateCardioMethod(context, itemId, input) {
        const membership = await this.resolveCoachMembership(context);
        await this.assertCardioMethodTypeExists(input.methodTypeId);
        const row = await this.readCardioMethodForUpdate(itemId);
        this.policy.assertCoachOwned((0, library_repository_prisma_helpers_1.toDomainScope)(row.scope), row.coachMembershipId, membership.id);
        const updated = await this.prisma.cardioMethod.update({
            where: { id: itemId },
            data: { ...(0, audit_fields_1.buildUpdateAuditFields)(context), ...(0, library_mappers_1.normalizeCardioMethodInput)(input) },
            include: CARDIO_METHOD_WITH_CATALOG,
        });
        return (0, library_mappers_1.mapCardioMethod)(updated);
    }
    async updateExercise(context, itemId, input) {
        const membership = await this.resolveCoachMembership(context);
        await this.assertExerciseMuscleGroupExists(input.muscleGroupId);
        const row = await this.readExerciseForUpdate(itemId);
        this.policy.assertCoachOwned((0, library_repository_prisma_helpers_1.toDomainScope)(row.scope), row.coachMembershipId, membership.id);
        const updated = await this.prisma.exercise.update({
            where: { id: itemId },
            data: { ...(0, audit_fields_1.buildUpdateAuditFields)(context), ...(0, library_mappers_1.normalizeExerciseInput)(input) },
            include: EXERCISE_WITH_CATALOG,
        });
        return (0, library_mappers_1.mapExercise)(updated);
    }
    async updateFood(context, itemId, input) {
        const membership = await this.resolveCoachMembership(context);
        const row = await this.readFoodForUpdate(itemId);
        this.policy.assertCoachOwned((0, library_repository_prisma_helpers_1.toDomainScope)(row.scope), row.coachMembershipId, membership.id);
        const updated = await this.prisma.food.update({
            where: { id: itemId },
            data: { ...(0, audit_fields_1.buildUpdateAuditFields)(context), ...(0, library_mappers_1.normalizeFoodInput)(input) },
        });
        return (0, library_mappers_1.mapFood)(updated);
    }
    async assertCardioMethodTypeExists(methodTypeId) {
        await (0, library_repository_prisma_helpers_1.assertCatalogExists)(() => this.prisma.cardioMethodType.findUnique({ where: { id: methodTypeId } }), 'Cardio method type not found');
    }
    async assertExerciseMuscleGroupExists(muscleGroupId) {
        await (0, library_repository_prisma_helpers_1.assertCatalogExists)(() => this.prisma.exerciseMuscleGroup.findUnique({ where: { id: muscleGroupId } }), 'Exercise muscle group not found');
    }
    async readCardioMethodForUpdate(itemId) {
        const row = await this.prisma.cardioMethod.findFirst({
            where: { archivedAt: null, id: itemId },
            select: { coachMembershipId: true, scope: true },
        });
        if (!row) {
            throw new common_1.NotFoundException('Cardio method not found');
        }
        return row;
    }
    async readExerciseForUpdate(itemId) {
        const row = await this.prisma.exercise.findFirst({
            where: { archivedAt: null, id: itemId },
            select: { coachMembershipId: true, scope: true },
        });
        if (!row) {
            throw new common_1.NotFoundException('Exercise not found');
        }
        return row;
    }
    async readFoodForUpdate(itemId) {
        const row = await this.prisma.food.findFirst({
            where: { archivedAt: null, id: itemId },
            select: { coachMembershipId: true, scope: true },
        });
        if (!row) {
            throw new common_1.NotFoundException('Food not found');
        }
        return row;
    }
    async resolveCoachMembership(context) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.COACH,
                user: { supabaseUid: context.subject },
            },
            select: { id: true, organizationId: true },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Coach membership not found');
        }
        return membership;
    }
};
exports.LibraryRepositoryPrisma = LibraryRepositoryPrisma;
exports.LibraryRepositoryPrisma = LibraryRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [library_edit_policy_1.LibraryEditPolicy,
        prisma_service_1.PrismaService])
], LibraryRepositoryPrisma);
