import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';

export const CLIENT_CLOCK_SKEW_MS = 2 * 60 * 1000;
export const WRITE_UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EditWindowPolicy {
  assertCanEdit(sessionDate: Date, now: Date, timezoneOffsetMinutes: number): void {
    if (now.getTime() > sessionDayEnd(sessionDate, timezoneOffsetMinutes).getTime()) {
      throw new ForbiddenException('Session edit window has expired');
    }
  }

  resolveWriteInstant(sessionDate: Date, now: Date, timezoneOffsetMinutes: number, occurredAt: Date | null): Date {
    if (!occurredAt) {
      this.assertCanEdit(sessionDate, now, timezoneOffsetMinutes);
      return now;
    }
    if (occurredAt.getTime() > now.getTime() + CLIENT_CLOCK_SKEW_MS) {
      throw new BadRequestException('Finish time is in the future');
    }
    const start = sessionDayStart(sessionDate, timezoneOffsetMinutes).getTime();
    const end = sessionDayEnd(sessionDate, timezoneOffsetMinutes).getTime();
    if (occurredAt.getTime() < start || occurredAt.getTime() > end || now.getTime() > end + WRITE_UPLOAD_GRACE_MS) {
      throw new ForbiddenException('Session edit window has expired');
    }
    return occurredAt;
  }
}

function sessionDayStart(sessionDate: Date, timezoneOffsetMinutes: number): Date {
  return shiftSessionDay(sessionDate, timezoneOffsetMinutes, 0, 0, 0, 0);
}

function sessionDayEnd(sessionDate: Date, timezoneOffsetMinutes: number): Date {
  return shiftSessionDay(sessionDate, timezoneOffsetMinutes, 23, 59, 59, 999);
}

function shiftSessionDay(
  sessionDate: Date,
  timezoneOffsetMinutes: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
): Date {
  const marker = Date.UTC(
    sessionDate.getUTCFullYear(),
    sessionDate.getUTCMonth(),
    sessionDate.getUTCDate(),
    hours,
    minutes,
    seconds,
    ms,
  );
  return new Date(marker - timezoneOffsetMinutes * 60_000);
}
