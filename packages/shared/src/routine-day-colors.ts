import { z } from 'zod';

export const updateRoutineDayColorSchema = z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
export const routineDayColorSchema = updateRoutineDayColorSchema.extend({ planDayId: z.string().uuid() });
export const routineDayColorsSchema = z.object({ colors: z.array(routineDayColorSchema) });
export type RoutineDayColors = z.infer<typeof routineDayColorsSchema>;
