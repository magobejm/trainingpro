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
exports.ChatTtlRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
let ChatTtlRepositoryPrisma = class ChatTtlRepositoryPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async deleteAttachments(ids) {
        if (ids.length === 0) {
            return 0;
        }
        const result = await this.prisma.chatAttachment.deleteMany({
            where: { id: { in: ids } },
        });
        return result.count;
    }
    async deleteExpiredMessages(now) {
        const result = await this.prisma.chatMessage.deleteMany({
            where: { expiresAt: { lte: now } },
        });
        return result.count;
    }
    findExpiredAttachments(now, limit) {
        return this.prisma.chatAttachment.findMany({
            where: { expiresAt: { lte: now } },
            select: { id: true, storagePath: true },
            orderBy: { expiresAt: 'asc' },
            take: limit,
        });
    }
};
exports.ChatTtlRepositoryPrisma = ChatTtlRepositoryPrisma;
exports.ChatTtlRepositoryPrisma = ChatTtlRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatTtlRepositoryPrisma);
