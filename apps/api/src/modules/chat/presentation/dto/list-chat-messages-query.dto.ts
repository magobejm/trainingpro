import { z } from 'zod';

export class ListChatMessagesQueryDto {
  static schema = z.object({
    threadId: z.string().uuid(),
    beforeId: z.string().uuid().optional(),
    before: z.string().datetime({ offset: true }).optional(),
  });

  threadId!: string;
  before?: string;
  beforeId?: string;
}
