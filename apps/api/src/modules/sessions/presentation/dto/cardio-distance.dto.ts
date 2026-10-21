import { z } from 'zod';

export class CardioDistanceDto {
  static schema = z.object({ distanceDoneMeters: z.number().min(0).max(500000).nullable() });
  distanceDoneMeters!: number | null;
}

export class CardioDistanceParamsDto {
  static schema = z.object({ blockId: z.string().uuid(), sessionId: z.string().uuid() });
  blockId!: string;
  sessionId!: string;
}
