import { z } from 'zod';

export class LibraryItemIdParamDto {
  static schema = z.object({
    itemId: z.string().uuid(),
  });

  itemId!: string;
}
