import { z } from 'zod';

export class EventIdParamDto {
  static schema = z.object({
    eventId: z.string().uuid(),
  });

  eventId!: string;
}
