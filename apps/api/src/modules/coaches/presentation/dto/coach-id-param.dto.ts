import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class CoachIdParamDto {
  static schema = z.object({
    coachMembershipId: postgresUuidString,
  });

  coachMembershipId!: string;
}
