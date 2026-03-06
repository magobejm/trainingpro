import { z } from 'zod';

export class ClientProgressPhotoIdParamDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    photoId: z.string().uuid(),
  });

  clientId!: string;
  photoId!: string;
}
