import { z } from 'zod';

export class ClientMePhysicalTestParamsDto {
  static schema = z.object({
    testId: z.string().uuid(),
  });

  testId!: string;
}
