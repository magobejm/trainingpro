import { z } from 'zod';

export class ClientLibraryQueryDto {
  static schema = z.object({
    q: z.string().optional(),
  });

  q?: string;
}
