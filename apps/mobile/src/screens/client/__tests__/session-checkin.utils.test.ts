import {
  shouldPromptSessionWellness,
  skippedFinishSessionPayload,
  skippedStartSessionPayload,
  startSessionPayloadFromMorningCheckin,
} from '../session-checkin.utils';

describe('session check-in skip', () => {
  it('does not prompt the old slider wellness questions', () => {
    expect(shouldPromptSessionWellness()).toBe(false);
  });

  it('starts and finishes the session without scores when there is no morning check-in', () => {
    expect(skippedStartSessionPayload()).toEqual({
      preFatigue: null,
      preMotivation: null,
      preRecovery: null,
      startMode: 'INTERACTIVE',
    });
    expect(startSessionPayloadFromMorningCheckin(null)).toEqual(skippedStartSessionPayload());
    expect(skippedFinishSessionPayload()).toEqual({
      comment: null,
      isIncomplete: false,
      postFatigue: null,
      postMood: null,
      postPain: null,
    });
  });

  it('applies morning check-in scores when starting the workout later', () => {
    expect(startSessionPayloadFromMorningCheckin({ sleep: 4, motivation: 5, recovery: 3 })).toEqual({
      preFatigue: 8,
      preMotivation: 10,
      preRecovery: 6,
      startMode: 'INTERACTIVE',
    });
  });
});
