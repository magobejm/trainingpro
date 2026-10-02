import { z } from 'zod';

export class SportBlockSetParamsDto {
  static schema = z.object({
    blockId: z.string().uuid(),
    sessionId: z.string().uuid(),
  });

  blockId!: string;
  sessionId!: string;
}
