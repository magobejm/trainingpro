import { z } from 'zod';

export class CreateClientProgressPhotoDto {
  static schema = z.object({
    imageUrl: z.string().url().max(500),
  });

  imageUrl!: string;
}
