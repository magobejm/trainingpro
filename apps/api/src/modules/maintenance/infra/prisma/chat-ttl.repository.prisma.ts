import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  ChatTtlRepositoryPort,
  ExpiredChatAttachment,
} from '../../domain/chat-ttl.repository.port';

@Injectable()
export class ChatTtlRepositoryPrisma implements ChatTtlRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAttachments(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await this.prisma.chatAttachment.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  async deleteExpiredMessages(now: Date): Promise<number> {
    const result = await this.prisma.chatMessage.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    return result.count;
  }

  findExpiredAttachments(now: Date, limit: number): Promise<ExpiredChatAttachment[]> {
    return this.prisma.chatAttachment.findMany({
      where: { expiresAt: { lte: now } },
      select: { id: true, storagePath: true },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });
  }
}
