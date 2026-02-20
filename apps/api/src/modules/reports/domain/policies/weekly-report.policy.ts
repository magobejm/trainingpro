import { BadRequestException } from '@nestjs/common';

export class WeeklyReportPolicy {
  ensureSessionDateMatchesReportDate(
    reportDate: Date,
    sessionDate: Date,
  ): void {
    if (toDateKey(reportDate) !== toDateKey(sessionDate)) {
      throw new BadRequestException('Post-session weekly report must match session day');
    }
  }

  resolveWeekStart(reportDate: Date): Date {
    const start = new Date(Date.UTC(
      reportDate.getUTCFullYear(),
      reportDate.getUTCMonth(),
      reportDate.getUTCDate(),
    ));
    const day = start.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + offset);
    return start;
  }
}

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}
