import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CHAT_MAX_MESSAGE_CHARS,
  CHAT_RETENTION_DAYS,
} from '../chat.constants';
import type { SendChatMessageInput } from '../chat.repository.port';

@Injectable()
export class ChatMessagePolicy {
  ensureMessagePayload(input: SendChatMessageInput): void {
    const text = input.text?.trim() ?? '';
    const attachmentsCount = input.attachments?.length ?? 0;
    if (text.length === 0 && attachmentsCount === 0) {
      throw new BadRequestException('Message requires text or attachments');
    }
    if (text.length > CHAT_MAX_MESSAGE_CHARS) {
      throw new BadRequestException('Message text exceeds max length');
    }
  }

  resolveExpiryDate(now: Date): Date {
    const expiresAt = new Date(now);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + CHAT_RETENTION_DAYS);
    return expiresAt;
  }
}
