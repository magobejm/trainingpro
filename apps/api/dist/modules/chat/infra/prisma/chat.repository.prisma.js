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
exports.ChatRepositoryPrisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const chat_constants_1 = require("../../domain/chat.constants");
const chat_message_policy_1 = require("../../domain/policies/chat-message.policy");
const chat_prisma_mappers_1 = require("./chat-prisma.mappers");
let ChatRepositoryPrisma = class ChatRepositoryPrisma {
    messagePolicy;
    prisma;
    constructor(messagePolicy, prisma) {
        this.messagePolicy = messagePolicy;
        this.prisma = prisma;
    }
    async listMessagesByThread(context, threadId) {
        await this.assertThreadAccess(context, threadId);
        const rows = await this.prisma.chatMessage.findMany({
            where: { threadId },
            orderBy: { createdAt: 'asc' },
            take: chat_constants_1.CHAT_PAGE_SIZE,
            include: { attachments: true },
        });
        return rows.map(chat_prisma_mappers_1.mapChatMessage);
    }
    async resolveThread(context, input) {
        const participant = await this.resolveParticipant(context, input.clientId);
        const row = await this.prisma.chatThread.upsert({
            where: {
                coachMembershipId_clientId: {
                    clientId: participant.clientId,
                    coachMembershipId: participant.coachMembershipId,
                },
            },
            create: {
                clientId: participant.clientId,
                coachMembershipId: participant.coachMembershipId,
                organizationId: participant.organizationId,
            },
            update: {
                archivedAt: null,
            },
        });
        return (0, chat_prisma_mappers_1.mapChatThread)(row);
    }
    async sendMessage(context, input) {
        const sender = await this.assertThreadAccess(context, input.threadId);
        const expiresAt = this.messagePolicy.resolveExpiryDate(new Date());
        const row = await this.prisma.chatMessage.create({
            data: {
                attachments: {
                    create: (input.attachments ?? []).map((attachment) => ({
                        expiresAt,
                        fileName: attachment.fileName,
                        kind: attachment.kind,
                        mimeType: attachment.mimeType,
                        publicUrl: attachment.publicUrl ?? null,
                        sizeBytes: attachment.sizeBytes,
                        storagePath: attachment.storagePath,
                    })),
                },
                expiresAt,
                senderRole: sender.senderRole,
                senderSubject: context.subject,
                text: input.text?.trim() || null,
                threadId: input.threadId,
            },
            include: { attachments: true },
        });
        await this.prisma.chatThread.update({
            where: { id: input.threadId },
            data: { updatedAt: new Date() },
        });
        return (0, chat_prisma_mappers_1.mapChatMessage)(row);
    }
    async assertThreadAccess(context, threadId) {
        const row = await this.findThreadByContext(context, threadId);
        if (!row) {
            throw new common_1.ForbiddenException('Chat thread access denied');
        }
        if (context.activeRole === 'coach') {
            return { senderRole: 'COACH', thread: row };
        }
        if (context.activeRole === 'client') {
            return { senderRole: 'CLIENT', thread: row };
        }
        throw new common_1.ForbiddenException('Unsupported role for chat');
    }
    async resolveParticipant(context, clientId) {
        if (context.activeRole === 'client') {
            return this.resolveClientParticipant(context.email);
        }
        if (context.activeRole !== 'coach') {
            throw new common_1.ForbiddenException('Only coach or client can resolve chat thread');
        }
        return this.resolveCoachParticipant(context.email, clientId);
    }
    async resolveClientParticipant(email) {
        const client = await this.readClientByEmail(email);
        return {
            clientId: client.id,
            coachMembershipId: client.coachMembershipId,
            organizationId: client.organizationId,
        };
    }
    async resolveCoachParticipant(email, clientId) {
        const resolvedClientId = this.requireClientId(clientId);
        const coachMembership = await this.readCoachMembershipByEmail(email);
        return this.readCoachClientParticipant(coachMembership.id, resolvedClientId);
    }
    requireClientId(clientId) {
        if (!clientId) {
            throw new common_1.BadRequestException('clientId is required for coach role');
        }
        return clientId;
    }
    async readCoachClientParticipant(coachMembershipId, clientId) {
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, coachMembershipId, id: clientId },
            select: { coachMembershipId: true, id: true, organizationId: true },
        });
        if (!client) {
            throw new common_1.ForbiddenException('Coach cannot access requested client chat');
        }
        return {
            clientId: client.id,
            coachMembershipId: client.coachMembershipId,
            organizationId: client.organizationId,
        };
    }
    async findThreadByContext(context, threadId) {
        if (context.activeRole === 'coach') {
            return this.prisma.chatThread.findFirst({
                where: {
                    archivedAt: null,
                    coachMembership: {
                        archivedAt: null,
                        isActive: true,
                        role: client_1.Role.COACH,
                        user: { email: context.email ?? '' },
                    },
                    id: threadId,
                },
                select: { id: true },
            });
        }
        if (context.activeRole === 'client') {
            return this.prisma.chatThread.findFirst({
                where: {
                    archivedAt: null,
                    client: { archivedAt: null, email: context.email ?? '' },
                    id: threadId,
                },
                select: { id: true },
            });
        }
        return null;
    }
    async readClientByEmail(email) {
        const client = await this.prisma.client.findFirst({
            where: { archivedAt: null, email: email ?? '' },
            select: {
                coachMembershipId: true,
                id: true,
                organizationId: true,
            },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client profile not found for chat');
        }
        return client;
    }
    async readCoachMembershipByEmail(email) {
        const membership = await this.prisma.organizationMember.findFirst({
            where: {
                archivedAt: null,
                isActive: true,
                role: client_1.Role.COACH,
                user: { email: email ?? '' },
            },
            select: { id: true },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Coach membership not found for chat');
        }
        return membership;
    }
};
exports.ChatRepositoryPrisma = ChatRepositoryPrisma;
exports.ChatRepositoryPrisma = ChatRepositoryPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_message_policy_1.ChatMessagePolicy,
        prisma_service_1.PrismaService])
], ChatRepositoryPrisma);
