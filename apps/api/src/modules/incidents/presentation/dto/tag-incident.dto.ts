import { z } from 'zod';

export class TagIncidentDto {
  static schema = z.object({
    tag: z.string().min(2).max(60),
  });

  tag!: string;
}
