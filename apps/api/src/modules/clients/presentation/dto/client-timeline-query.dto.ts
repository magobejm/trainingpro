import { z } from 'zod';
import { TIMELINE_DEFAULT_LIMIT, TIMELINE_MAX_LIMIT } from '../../domain/client-timeline';

export class ClientTimelineQueryDto {
  static schema = z.object({
    before: z.string().datetime({ offset: true }).optional(),
    beforeId: z.string().min(1).max(80).optional(),
    limit: z.coerce.number().int().min(1).max(TIMELINE_MAX_LIMIT).optional(),
    includeOutcome: z.enum(['true', 'false']).optional(),
  });

  before?: string;
  beforeId?: string;
  limit?: number;
  includeOutcome?: string;
}

export function timelineQuery(query: ClientTimelineQueryDto): {
  cursor: { at: string; id: string } | null;
  limit: number;
  includeOutcome?: boolean;
} {
  const parsed = ClientTimelineQueryDto.schema.parse(query);
  const limit = parsed.limit ?? TIMELINE_DEFAULT_LIMIT;
  const metadata = parsed.includeOutcome === 'true' ? { includeOutcome: true } : {};
  if (!parsed.before) return { cursor: null, limit, ...metadata };
  return { cursor: { at: parsed.before, id: parsed.beforeId ?? '' }, limit, ...metadata };
}
