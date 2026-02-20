import { z } from 'zod';

export class ListChatMessagesQueryDto {
  static schema = z.object({
    threadId: z.string().uuid(),
  });

  threadId!: string;
}
