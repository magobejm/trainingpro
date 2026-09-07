import { ForbiddenException } from '@nestjs/common';
import { EditWindowPolicy } from '../../src/modules/sessions/domain/policies/edit-window.policy';

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

  it('allows logging during the evening in UTC-4', () => {
    const now = new Date('2026-09-08T03:00:00.000Z');
    expect(() => policy.assertCanEdit(sessionDate, now, -240)).not.toThrow();
  });
});
