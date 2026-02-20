import { z } from 'zod';

const topicSchema = z.enum([
  'SESSION_COMPLETED',
  'INCIDENT_CRITICAL',
  'CLIENT_INACTIVE_3D',
  'ADHERENCE_LOW_WEEKLY',
  'CLIENT_REMINDER',
]);

export class SetNotificationPreferenceDto {
  static schema = z.object({
    enabled: z.boolean(),
    topic: topicSchema,
  });

  enabled!: boolean;
  topic!:
    | 'ADHERENCE_LOW_WEEKLY'
    | 'CLIENT_INACTIVE_3D'
    | 'CLIENT_REMINDER'
    | 'INCIDENT_CRITICAL'
    | 'SESSION_COMPLETED';
}
