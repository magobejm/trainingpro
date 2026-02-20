import { z } from 'zod';

export class CoachIdParamDto {
  static schema = z.object({
    coachMembershipId: z.string().uuid(),
  });

  coachMembershipId!: string;
}
