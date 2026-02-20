import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class EditWindowPolicy {
  assertCanEdit(
    sessionDate: Date,
    now: Date,
    timezoneOffsetMinutes: number,
  ): void {
    const end = computeSessionDayEnd(sessionDate, timezoneOffsetMinutes);
    if (now.getTime() > end.getTime()) {
      throw new ForbiddenException('Session edit window has expired');
    }
  }
}

function computeSessionDayEnd(sessionDate: Date, timezoneOffsetMinutes: number): Date {
  const utcDate = new Date(sessionDate.getTime());
  const shifted = new Date(utcDate.getTime() - timezoneOffsetMinutes * 60_000);
  shifted.setUTCHours(23, 59, 59, 999);
  return new Date(shifted.getTime() + timezoneOffsetMinutes * 60_000);
}
