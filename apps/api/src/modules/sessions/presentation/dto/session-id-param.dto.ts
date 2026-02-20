import { z } from 'zod';

export class SessionIdParamDto {
  static schema = z.object({
    sessionId: z.string().uuid(),
  });

  sessionId!: string;
}
