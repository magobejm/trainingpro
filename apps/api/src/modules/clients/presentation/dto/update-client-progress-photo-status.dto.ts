import { z } from 'zod';

export class UpdateClientProgressPhotoStatusDto {
  static schema = z.object({
    archived: z.boolean(),
  });

  archived!: boolean;
}
