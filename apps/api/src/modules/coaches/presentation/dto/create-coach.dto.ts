import { z } from 'zod';

export class CreateCoachDto {
  static schema = z.object({
    email: z.string().email(),
  });

  email!: string;
}
