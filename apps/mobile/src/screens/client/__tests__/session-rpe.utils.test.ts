import {
  clampSessionRpe,
  DEFAULT_SESSION_RPE,
  finishSessionWithRpePayload,
  formatSessionRpe,
  formatSessionRpeChatNotice,
  SESSION_RPE_STEPS,
  sessionRpeBand,
} from '../session-rpe.utils';

describe('session RPE', () => {
  it('defaults to 7.5 and steps of 0.5 from 1 to 10', () => {
    expect(DEFAULT_SESSION_RPE).toBe(7.5);
    expect(SESSION_RPE_STEPS).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);
  });

  it('clamps and snaps to half steps', () => {
    expect(clampSessionRpe(7.4)).toBe(7.5);
    expect(clampSessionRpe(0)).toBe(1);
    expect(clampSessionRpe(11)).toBe(10);
    expect(clampSessionRpe(8)).toBe(8);
  });

  it('formats whole numbers without decimals', () => {
    expect(formatSessionRpe(8)).toBe('8');
    expect(formatSessionRpe(7.5)).toBe('7.5');
  });

  it('maps values to prototype effort bands', () => {
    expect(sessionRpeBand(2).key).toBe('veryEasy');
    expect(sessionRpeBand(3.5).key).toBe('easy');
    expect(sessionRpeBand(5.5).key).toBe('moderate');
    expect(sessionRpeBand(7).key).toBe('hard');
    expect(sessionRpeBand(7.5).key).toBe('veryHard');
    expect(sessionRpeBand(9.5).key).toBe('extremelyHard');
    expect(sessionRpeBand(10).key).toBe('max');
  });

  it('finishes the session with the perceived RPE', () => {
    expect(finishSessionWithRpePayload(7.5)).toEqual({
      comment: null,
      isIncomplete: false,
      postFatigue: null,
      postMood: null,
      postPain: null,
      sessionRpe: 7.5,
    });
  });

  it('formats a chat notice for the coach', () => {
    expect(formatSessionRpeChatNotice(7.5, 'Muy duro')).toBe('RPE de la sesión registrado: 7.5/10 (Muy duro).');
  });
});
