import { z } from 'zod';

export class GetWeeklyReportQueryDto {
  static schema = z.object({
    reportDate: z.string().date(),
  });

  reportDate!: string;
}
