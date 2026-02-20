import { z } from 'zod';

export class ClientIdParamDto {
  static schema = z.object({
    clientId: z.string().uuid(),
  });

  clientId!: string;
}
