import { z } from 'zod';

export const copyNameSchema = z.object({ name: z.string().trim().min(1).max(120) });
