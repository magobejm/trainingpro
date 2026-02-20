import { z } from 'zod';

export class CreateCoachDto {
  static schema = z.object({
    email: z.string().email(),
    supabaseUid: z.string().uuid(),
  });

  email!: string;
  supabaseUid!: string;
}
