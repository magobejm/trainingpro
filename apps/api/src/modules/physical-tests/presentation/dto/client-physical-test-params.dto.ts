import { z } from 'zod';

export class ClientPhysicalTestParamsDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    testId: z.string().uuid(),
  });

  clientId!: string;
  testId!: string;
}
