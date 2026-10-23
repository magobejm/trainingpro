import { z } from 'zod';
import { sessionOutcomeSchema } from '../session-outcome';

export const clientTimelineItemSchema = z
  .object({
    detail: z.string().nullable(),
    outcome: sessionOutcomeSchema.optional(),
    sessionDate: z.string().date().optional(),
    originDate: z.string().date().nullable().optional(),
    skipReason: z.string().nullable().optional(),
    id: z.string(),
    kind: z.enum(['chat', 'incident', 'note', 'nutrition', 'photo', 'session', 'test']),
    occurredAt: z.string(),
    refId: z.string(),
    title: z.string(),
  })
  .strict();

export const clientTimelineResponseSchema = z
  .object({
    items: z.array(clientTimelineItemSchema),
    nextBefore: z.string().nullable(),
    nextBeforeId: z.string().nullable(),
  })
  .strict();

export type ClientTimelineItem = z.infer<typeof clientTimelineItemSchema>;
export type ClientTimelineResponse = z.infer<typeof clientTimelineResponseSchema>;
