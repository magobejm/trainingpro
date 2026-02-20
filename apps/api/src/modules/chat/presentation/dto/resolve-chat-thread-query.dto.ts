import { z } from 'zod';

export class ResolveChatThreadQueryDto {
  static schema = z.object({
    clientId: z.string().uuid().optional(),
  });

  clientId?: string;
}
