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
exports.CoachAdminRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
let CoachAdminRepositoryPrisma = class CoachAdminRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async activateCoach(adminSupabaseUid, coachMembershipId) {
        return this.updateCoachStatus(adminSupabaseUid, coachMembershipId, true);
    }
    async archiveCoach(adminSupabaseUid, coachMembershipId) {
        const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
        const membership = await this.findCoachMembership(organizationId, coachMembershipId);
        return this.toCoachView(await this.prisma.organizationMember.update({
            where: { id: membership.id },
            data: { archivedAt: new Date(), isActive: false },
            include: { user: { select: { email: true } } },
        }));
    }
    async createCoach(adminSupabaseUid, input) {
        const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
        const userId = await this.resolveCoachUserId(input);
        const membership = await this.prisma.organizationMember.upsert({
            where: { organizationId_userId_role: { organizationId, role: client_1.Role.COACH, userId } },
            create: { organizationId, role: client_1.Role.COACH, userId },
            update: { archivedAt: null, isActive: true },
            include: { user: { select: { email: true } } },
        });
        return this.toCoachView(membership);
    }
    async deactivateCoach(adminSupabaseUid, coachMembershipId) {
        return this.updateCoachStatus(adminSupabaseUid, coachMembershipId, false);
    }
    async listCoaches(adminSupabaseUid) {
        const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
        const memberships = await this.prisma.organizationMember.findMany({
            where: { archivedAt: null, organizationId, role: client_1.Role.COACH },
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return memberships.map((membership) => this.toCoachView(membership));
    }
    async updateCoachStatus(adminSupabaseUid, coachMembershipId, isActive) {
        const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
        const membership = await this.findCoachMembership(organizationId, coachMembershipId);
        return this.toCoachView(await this.prisma.organizationMember.update({
            where: { id: membership.id },
            data: { isActive },
            include: { user: { select: { email: true } } },
        }));
    }
    async resolveAdminOrganizationId(adminSupabaseUid) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.ADMIN,
                user: { supabaseUid: adminSupabaseUid },
            },
            select: { organizationId: true },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Admin membership not found');
        }
        return membership.organizationId;
    }
    async resolveCoachUserId(input) {
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: input.email }, { supabaseUid: input.supabaseUid }] },
            select: { id: true },
        });
        if (existingUser) {
            return existingUser.id;
        }
        const createdUser = await this.prisma.user.create({
            data: { email: input.email, supabaseUid: input.supabaseUid },
            select: { id: true },
        });
        return createdUser.id;
    }
    async findCoachMembership(organizationId, coachMembershipId) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: { archivedAt: null, id: coachMembershipId, organizationId, role: client_1.Role.COACH },
            select: { id: true },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Coach membership not found');
        }
        return membership;
    }
    toCoachView(membership) {
        return {
            coachMembershipId: membership.id,
            email: membership.user.email,
            isActive: membership.isActive,
            userId: membership.userId,
        };
    }
};
exports.CoachAdminRepositoryPrisma = CoachAdminRepositoryPrisma;
exports.CoachAdminRepositoryPrisma = CoachAdminRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoachAdminRepositoryPrisma);
