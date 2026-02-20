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
exports.OrgAdminRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
let OrgAdminRepositoryPrisma = class OrgAdminRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOccupancyByAdmin(adminSupabaseUid) {
        const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
        return this.readOccupancy(organizationId);
    }
    async updateClientLimitByAdmin(adminSupabaseUid, clientLimit) {
        const organizationId = await this.resolveAdminOrganizationId(adminSupabaseUid);
        await this.prisma.organizationSubscription.upsert({
            where: { organizationId },
            create: { activeClientCount: 0, clientLimit, organizationId },
            update: { clientLimit },
        });
        return this.readOccupancy(organizationId);
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
    async readOccupancy(organizationId) {
        const subscription = await this.prisma.organizationSubscription.findUnique({
            where: { organizationId },
            select: { activeClientCount: true, clientLimit: true },
        });
        if (!subscription) {
            return { activeClientCount: 0, clientLimit: 0, organizationId };
        }
        return { ...subscription, organizationId };
    }
};
exports.OrgAdminRepositoryPrisma = OrgAdminRepositoryPrisma;
exports.OrgAdminRepositoryPrisma = OrgAdminRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrgAdminRepositoryPrisma);
