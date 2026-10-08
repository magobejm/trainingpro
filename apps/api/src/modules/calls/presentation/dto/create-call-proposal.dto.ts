import { z } from 'zod';

export class CreateCallProposalDto {
  static schema = z.object({
    clientId: z.string().uuid().optional(),
    date: z.string().date(),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  });

  clientId?: string;
  date!: string;
  time!: string;
}
