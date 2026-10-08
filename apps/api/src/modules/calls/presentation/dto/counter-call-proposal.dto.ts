import { z } from 'zod';

export class ProposalIdParamDto {
  static schema = z.object({
    proposalId: z.string().uuid(),
  });

  proposalId!: string;
}

export class CounterCallProposalDto {
  static schema = z.object({
    time: z.string().regex(/^\d{2}:\d{2}$/),
  });

  time!: string;
}
