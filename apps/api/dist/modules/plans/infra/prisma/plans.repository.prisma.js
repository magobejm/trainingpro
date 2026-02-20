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
exports.PlansRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_fields_1 = require("../../../../common/audit/audit-fields");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const plans_cardio_prisma_helpers_1 = require("./plans-cardio.prisma.helpers");
let PlansRepositoryPrisma = class PlansRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCardioTemplate(context, input) {
        const membership = await this.resolveCoachMembership(context);
        const row = await this.prisma.planTemplate.create({
            data: {
                ...(0, audit_fields_1.buildCreateAuditFields)(context),
                coachMembershipId: membership.id,
                days: { create: input.days.map(plans_cardio_prisma_helpers_1.mapCardioDayCreate) },
                kind: client_1.TemplateKind.CARDIO,
                name: input.name.trim(),
                organizationId: membership.organizationId,
            },
            include: (0, plans_cardio_prisma_helpers_1.cardioTemplateInclude)(),
        });
        return (0, plans_cardio_prisma_helpers_1.mapCardioTemplate)(row);
    }
    async createTemplate(context, input) {
        const membership = await this.resolveCoachMembership(context);
        const row = await this.prisma.planTemplate.create({
            data: {
                ...(0, audit_fields_1.buildCreateAuditFields)(context),
                coachMembershipId: membership.id,
                kind: client_1.TemplateKind.STRENGTH,
                name: input.name.trim(),
                organizationId: membership.organizationId,
                days: { create: input.days.map(mapDayCreate) },
            },
            include: templateInclude(),
        });
        return mapTemplate(row);
    }
    async listTemplates(context) {
        const membership = await this.resolveCoachMembership(context);
        const rows = await this.prisma.planTemplate.findMany({
            include: templateInclude(),
            orderBy: { updatedAt: 'desc' },
            where: { archivedAt: null, coachMembershipId: membership.id, kind: client_1.TemplateKind.STRENGTH },
        });
        return rows.map(mapTemplate);
    }
    async listCardioTemplates(context) {
        const membership = await this.resolveCoachMembership(context);
        const rows = await this.prisma.planTemplate.findMany({
            include: (0, plans_cardio_prisma_helpers_1.cardioTemplateInclude)(),
            orderBy: { updatedAt: 'desc' },
            where: { archivedAt: null, coachMembershipId: membership.id, kind: client_1.TemplateKind.CARDIO },
        });
        return rows.map(plans_cardio_prisma_helpers_1.mapCardioTemplate);
    }
    async updateTemplate(context, templateId, input) {
        const membership = await this.resolveCoachMembership(context);
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.planTemplate.findFirst({
                where: { archivedAt: null, coachMembershipId: membership.id, id: templateId },
                select: { id: true, templateVersion: true },
            });
            if (!current) {
                throw new common_1.NotFoundException('Plan template not found');
            }
            await tx.planDay.deleteMany({ where: { templateId: current.id } });
            const row = await tx.planTemplate.update({
                where: { id: current.id },
                data: {
                    ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                    name: input.name.trim(),
                    templateVersion: current.templateVersion + 1,
                    days: { create: input.days.map(mapDayCreate) },
                },
                include: templateInclude(),
            });
            return mapTemplate(row);
        });
    }
    async updateCardioTemplate(context, templateId, input) {
        const membership = await this.resolveCoachMembership(context);
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.planTemplate.findFirst({
                where: { archivedAt: null, coachMembershipId: membership.id, id: templateId },
                select: { id: true, templateVersion: true },
            });
            if (!current) {
                throw new common_1.NotFoundException('Cardio template not found');
            }
            await tx.planDay.deleteMany({ where: { templateId: current.id } });
            const row = await tx.planTemplate.update({
                where: { id: current.id },
                data: {
                    ...(0, audit_fields_1.buildUpdateAuditFields)(context),
                    days: { create: input.days.map(plans_cardio_prisma_helpers_1.mapCardioDayCreate) },
                    name: input.name.trim(),
                    templateVersion: current.templateVersion + 1,
                },
                include: (0, plans_cardio_prisma_helpers_1.cardioTemplateInclude)(),
            });
            return (0, plans_cardio_prisma_helpers_1.mapCardioTemplate)(row);
        });
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
exports.PlansRepositoryPrisma = PlansRepositoryPrisma;
exports.PlansRepositoryPrisma = PlansRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlansRepositoryPrisma);
function mapDayCreate(day) {
    return {
        dayIndex: day.dayIndex,
        title: day.title.trim(),
        exercises: { create: day.exercises.map(mapExerciseCreate) },
    };
}
function mapExerciseCreate(exercise) {
    return {
        displayName: exercise.displayName.trim(),
        fieldModes: {
            create: exercise.fieldModes.map((entry) => ({
                fieldKey: entry.fieldKey.trim(),
                mode: entry.mode,
            })),
        },
        libraryExercise: connectExercise(exercise.exerciseLibraryId),
        notes: normalizeText(exercise.notes),
        perSetWeightRangesJson: normalizePerSetRanges(exercise),
        repsMax: exercise.repsMax ?? null,
        repsMin: exercise.repsMin ?? null,
        setsPlanned: exercise.setsPlanned ?? null,
        sortOrder: exercise.sortOrder,
        weightRangeMaxKg: toDecimal(exercise.weightRangeMaxKg),
        weightRangeMinKg: toDecimal(exercise.weightRangeMinKg),
    };
}
function connectExercise(exerciseLibraryId) {
    if (!exerciseLibraryId) {
        return undefined;
    }
    return { connect: { id: exerciseLibraryId } };
}
function normalizePerSetRanges(exercise) {
    if (!exercise.perSetWeightRanges || exercise.perSetWeightRanges.length === 0) {
        return undefined;
    }
    return exercise.perSetWeightRanges.map((entry) => ({
        maxKg: entry.maxKg ?? null,
        minKg: entry.minKg ?? null,
    }));
}
function normalizeText(value) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}
function toDecimal(value) {
    return typeof value === 'number' ? new client_1.Prisma.Decimal(value) : null;
}
function mapTemplate(row) {
    return {
        createdAt: row.createdAt,
        days: row.days.map(mapTemplateDay),
        id: row.id,
        name: row.name,
        templateVersion: row.templateVersion,
        updatedAt: row.updatedAt,
    };
}
function mapTemplateDay(day) {
    return {
        dayIndex: day.dayIndex,
        exercises: day.exercises.map(mapTemplateExercise),
        id: day.id,
        title: day.title,
    };
}
function mapTemplateExercise(exercise) {
    return {
        displayName: exercise.displayName,
        exerciseLibraryId: exercise.exerciseLibraryId,
        fieldModes: exercise.fieldModes.map((entry) => ({
            fieldKey: entry.fieldKey,
            mode: entry.mode,
        })),
        id: exercise.id,
        notes: exercise.notes,
        prescription: {
            defaultWeightRange: {
                maxKg: toNumber(exercise.weightRangeMaxKg),
                minKg: toNumber(exercise.weightRangeMinKg),
            },
            perSetWeightRanges: readPerSetRanges(exercise.perSetWeightRangesJson),
            repsMax: exercise.repsMax,
            repsMin: exercise.repsMin,
            setsPlanned: exercise.setsPlanned,
        },
        sortOrder: exercise.sortOrder,
    };
}
function readPerSetRanges(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.map((entry) => {
        const item = entry;
        return { maxKg: item.maxKg ?? null, minKg: item.minKg ?? null };
    });
}
function templateInclude() {
    return {
        days: {
            include: {
                exercises: {
                    include: { fieldModes: true },
                    orderBy: { sortOrder: 'asc' },
                    where: { archivedAt: null },
                },
            },
            orderBy: { dayIndex: 'asc' },
            where: { archivedAt: null },
        },
    };
}
function toNumber(value) {
    return value ? Number(value) : null;
}
