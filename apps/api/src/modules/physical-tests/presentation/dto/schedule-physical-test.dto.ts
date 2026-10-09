import { z } from 'zod';

export class SchedulePhysicalTestDto {
  static schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    physicalTestId: z.string().uuid(),
    replace: z.boolean().optional(),
  });

  date!: string;
  physicalTestId!: string;
  replace?: boolean;
}

export class PhysicalTestScheduleRangeQueryDto {
  static schema = z.object({
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  dateFrom!: string;
  dateTo!: string;
}
