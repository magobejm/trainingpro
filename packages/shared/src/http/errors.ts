import { z } from 'zod';

export const httpErrorSchema = z
  .object({
    error: z.string(),
    message: z.union([z.string(), z.array(z.string())]),
    requestId: z.string().uuid().optional(),
    statusCode: z.number().int(),
  })
  .strict();

export type HttpErrorBody = z.infer<typeof httpErrorSchema>;
