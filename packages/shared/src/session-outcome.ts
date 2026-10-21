import { z } from 'zod';

export const sessionOutcomeSchema = z.enum(['done', 'incomplete', 'in_progress', 'pending', 'skipped']);
export type SessionOutcome = z.infer<typeof sessionOutcomeSchema>;

export function sessionOutcome(row: {
  isCompleted: boolean;
  isIncomplete: boolean;
  skippedAt?: Date | null | string;
  status: string;
}): SessionOutcome {
  if (row.isIncomplete) return 'incomplete';
  if (row.isCompleted || row.status === 'COMPLETED') return 'done';
  if (row.status === 'IN_PROGRESS') return 'in_progress';
  if (row.skippedAt) return 'skipped';
  return 'pending';
}
