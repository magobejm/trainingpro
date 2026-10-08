import { describe, expect, it } from 'vitest';
import { callStatusLabelKey, fixedColorFor } from './calendar-fixed-colors';

describe('fixedColorFor', () => {
  it('gives notes and calls a fixed dark color and leaves workouts free', () => {
    expect(fixedColorFor('note')?.bg).toBe('#172554');
    expect(fixedColorFor('call')?.bg).toBe('#065f46');
    expect(fixedColorFor('reminder')?.bg).toBe('#065f46');
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
