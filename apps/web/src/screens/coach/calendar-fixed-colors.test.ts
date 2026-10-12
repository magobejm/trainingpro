import { describe, expect, it } from 'vitest';
import { colors } from '@trainerpro/ui';
import { callStatusLabelKey, fixedColorFor } from './calendar-fixed-colors';

describe('fixedColorFor', () => {
  it('gives notes and calls a token color per event type and leaves workouts free', () => {
    expect(fixedColorFor('note')?.bg).toBe(colors.infoSoft);
    expect(fixedColorFor('call')?.bg).toBe(colors.successSoft);
    expect(fixedColorFor('reminder')?.bg).toBe(colors.successSoft);
    expect(fixedColorFor('physical_test')?.bg).toBe(colors.primarySoft);
    expect(fixedColorFor('workout')).toBeNull();
  });
});

describe('callStatusLabelKey', () => {
  it('labels pending and unconfirmed calls and says nothing for accepted ones', () => {
    expect(callStatusLabelKey('pending')).toBe('coach.calendar.call.pending');
    expect(callStatusLabelKey('unconfirmed')).toBe('coach.calendar.call.unconfirmed');
    expect(callStatusLabelKey('accepted')).toBeNull();
    expect(callStatusLabelKey(undefined)).toBeNull();
  });
});
