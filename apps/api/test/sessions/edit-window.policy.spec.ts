import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EditWindowPolicy } from '../../src/modules/sessions/domain/policies/edit-window.policy';
import { readTimezoneOffset } from '../../src/modules/sessions/presentation/read-timezone-offset';

describe('EditWindowPolicy', () => {
  const policy = new EditWindowPolicy();
  const sessionDate = new Date('2026-09-07T00:00:00.000Z');

  it('allows logging a set during the evening in UTC+2', () => {
    const now = new Date('2026-09-07T18:50:00.000Z');
    expect(() => policy.assertCanEdit(sessionDate, now, 120)).not.toThrow();
  });

  it('rejects logging after the local calendar day ends in UTC+2', () => {
    const now = new Date('2026-09-07T22:00:00.000Z');
    expect(() => policy.assertCanEdit(sessionDate, now, 120)).toThrow(ForbiddenException);
  });

  it('allows the last millisecond of the local day and rejects the next one', () => {
    expect(() => policy.assertCanEdit(sessionDate, new Date('2026-09-07T21:59:59.999Z'), 120)).not.toThrow();
    expect(() => policy.assertCanEdit(sessionDate, new Date('2026-09-07T22:00:00.000Z'), 120)).toThrow(ForbiddenException);
  });

  it('rejects the previous session at 00:30 local', () => {
    const previousDay = new Date('2026-09-06T00:00:00.000Z');
    const halfPastMidnight = new Date('2026-09-06T22:30:00.000Z');
    expect(() => policy.assertCanEdit(previousDay, halfPastMidnight, 120)).toThrow(ForbiddenException);
  });

  it('uses the winter offset after the October clock change', () => {
    const changeDay = new Date('2026-10-25T00:00:00.000Z');
    expect(() => policy.assertCanEdit(changeDay, new Date('2026-10-25T22:30:00.000Z'), 60)).not.toThrow();
    expect(() => policy.assertCanEdit(changeDay, new Date('2026-10-25T23:00:00.000Z'), 60)).toThrow(ForbiddenException);
  });

  it('keeps the October 25 session open at 01:30 local while the offset is still 120', () => {
    const changeDay = new Date('2026-10-25T00:00:00.000Z');
    const stillSummer = new Date('2026-10-24T23:30:00.000Z');
    expect(() => policy.assertCanEdit(changeDay, stillSummer, 120)).not.toThrow();
  });

  it('uses the summer offset after the March clock change', () => {
    const changeDay = new Date('2026-03-29T00:00:00.000Z');
    expect(() => policy.assertCanEdit(changeDay, new Date('2026-03-29T21:30:00.000Z'), 120)).not.toThrow();
    expect(() => policy.assertCanEdit(changeDay, new Date('2026-03-29T22:00:00.000Z'), 120)).toThrow(ForbiddenException);
  });

  it('treats a missing header as UTC', () => {
    expect(readTimezoneOffset(undefined)).toBe(0);
    expect(() => policy.assertCanEdit(sessionDate, new Date('2026-09-07T23:30:00.000Z'), 0)).not.toThrow();
    expect(() => policy.assertCanEdit(sessionDate, new Date('2026-09-08T00:00:00.000Z'), 0)).toThrow(ForbiddenException);
  });

  it('allows logging during the evening in UTC-4', () => {
    const now = new Date('2026-09-08T03:00:00.000Z');
    expect(() => policy.assertCanEdit(sessionDate, now, -240)).not.toThrow();
  });

  it('stores a phone finish from the session day after the server clock has moved on', () => {
    const now = new Date('2026-09-08T08:00:00.000Z');
    const finishedAt = new Date('2026-09-07T18:00:00.000Z');
    expect(policy.resolveWriteInstant(sessionDate, now, 120, finishedAt)).toEqual(finishedAt);
  });

  it('rejects a phone finish more than two minutes ahead of the server', () => {
    const now = new Date('2026-09-07T18:00:00.000Z');
    const finishedAt = new Date('2026-09-07T18:03:00.000Z');
    expect(() => policy.resolveWriteInstant(sessionDate, now, 120, finishedAt)).toThrow(BadRequestException);
  });

  it('rejects a phone finish from outside the session day', () => {
    const now = new Date('2026-09-07T18:00:00.000Z');
    const before = new Date('2026-09-06T21:00:00.000Z');
    expect(() => policy.resolveWriteInstant(sessionDate, now, 120, before)).toThrow(ForbiddenException);
  });

  it('rejects a queued finish more than 24 hours after the session day', () => {
    const now = new Date('2026-09-08T22:00:00.000Z');
    const finishedAt = new Date('2026-09-07T18:00:00.000Z');
    expect(() => policy.resolveWriteInstant(sessionDate, now, 120, finishedAt)).toThrow(ForbiddenException);
  });

  it('keeps the server clock when the client does not send a time', () => {
    const now = new Date('2026-09-07T18:50:00.000Z');
    expect(policy.resolveWriteInstant(sessionDate, now, 120, null)).toEqual(now);
    expect(() => policy.resolveWriteInstant(sessionDate, new Date('2026-09-07T22:00:00.000Z'), 120, null)).toThrow(
      ForbiddenException,
    );
  });

  it('drops an offset outside the real timezone range', () => {
    expect(readTimezoneOffset('120')).toBe(120);
    expect(readTimezoneOffset('-720')).toBe(-720);
    expect(readTimezoneOffset('840')).toBe(840);
    expect(readTimezoneOffset('-721')).toBe(0);
    expect(readTimezoneOffset('841')).toBe(0);
    expect(readTimezoneOffset('no')).toBe(0);
  });
});
