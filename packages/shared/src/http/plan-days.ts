import { z } from 'zod';
import type { ClientRoutineDay } from '../client-plan/types';

/** Respuesta de GET /clients/me/plan-days?items=id@YYYY-MM-DD,... Los días que no existen se omiten. */
export const clientPlanDayBatchResponseSchema = z
  .object({
    items: z.array(
      z
        .object({
          day: z.custom<ClientRoutineDay>((value) => typeof value === 'object' && value !== null),
          on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          planDayId: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type ClientPlanDayBatchResponse = z.infer<typeof clientPlanDayBatchResponseSchema>;
