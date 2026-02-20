import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { CHAT_PAGE_SIZE } from '../../domain/chat.constants';
import type {
  ChatRepositoryPort,
  ResolveChatThreadInput,
  SendChatMessageInput,
} from '../../domain/chat.repository.port';
import { ChatMessagePolicy } from '../../domain/policies/chat-message.policy';
import { mapChatMessage, mapChatThread } from './chat-prisma.mappers';

@Injectable()
export class ChatRepositoryPrisma implements ChatRepositoryPort {
  constructor(
    private readonly messagePolicy: ChatMessagePolicy,
    private readonly prisma: PrismaService,
  ) {}

  async listMessagesByThread(context: AuthContext, threadId: string) {
    await this.assertThreadAccess(context, threadId);
    const rows = await this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      take: CHAT_PAGE_SIZE,
      include: { attachments: true },
    });
    return rows.map(mapChatMessage);
  }

  async resolveThread(context: AuthContext, input: ResolveChatThreadInput) {
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
    return mapChatThread(row);
  }

  async sendMessage(context: AuthContext, input: SendChatMessageInput) {
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
    return mapChatMessage(row);
  }

  private async assertThreadAccess(context: AuthContext, threadId: string) {
    const row = await this.findThreadByContext(context, threadId);
    if (!row) {
      throw new ForbiddenException('Chat thread access denied');
    }
    if (context.activeRole === 'coach') {
      return { senderRole: 'COACH' as const, thread: row };
    }
    if (context.activeRole === 'client') {
      return { senderRole: 'CLIENT' as const, thread: row };
    }
    throw new ForbiddenException('Unsupported role for chat');
  }

  private async resolveParticipant(context: AuthContext, clientId?: string) {
    if (context.activeRole === 'client') {
      return this.resolveClientParticipant(context.email);
    }
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach or client can resolve chat thread');
    }
    return this.resolveCoachParticipant(context.email, clientId);
  }

  private async resolveClientParticipant(email: string | undefined) {
    const client = await this.readClientByEmail(email);
    return {
      clientId: client.id,
      coachMembershipId: client.coachMembershipId,
      organizationId: client.organizationId,
    };
  }

  private async resolveCoachParticipant(email: string | undefined, clientId?: string) {
    const resolvedClientId = this.requireClientId(clientId);
    const coachMembership = await this.readCoachMembershipByEmail(email);
    return this.readCoachClientParticipant(coachMembership.id, resolvedClientId);
  }

  private requireClientId(clientId?: string): string {
    if (!clientId) {
      throw new BadRequestException('clientId is required for coach role');
    }
    return clientId;
  }

  private async readCoachClientParticipant(coachMembershipId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { coachMembershipId: true, id: true, organizationId: true },
    });
    if (!client) {
      throw new ForbiddenException('Coach cannot access requested client chat');
    }
    return {
      clientId: client.id,
      coachMembershipId: client.coachMembershipId,
      organizationId: client.organizationId,
    };
  }

  private async findThreadByContext(context: AuthContext, threadId: string) {
    if (context.activeRole === 'coach') {
      return this.prisma.chatThread.findFirst({
        where: {
          archivedAt: null,
          coachMembership: {
            archivedAt: null,
            isActive: true,
            role: Role.COACH,
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

  private async readClientByEmail(email: string | undefined) {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email: email ?? '' },
      select: {
        coachMembershipId: true,
        id: true,
        organizationId: true,
      },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found for chat');
    }
    return client;
  }

  private async readCoachMembershipByEmail(email: string | undefined) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { email: email ?? '' },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Coach membership not found for chat');
    }
    return membership;
  }
}
