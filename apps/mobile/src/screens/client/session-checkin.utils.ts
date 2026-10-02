import { scaleFiveToTen, type MorningCheckinScores } from './daily-checkin.utils';

export function shouldPromptSessionWellness(): boolean {
  return false;
}

export function skippedStartSessionPayload(): {
  preFatigue: null;
  preMotivation: null;
  preRecovery: null;
  startMode: 'INTERACTIVE';
} {
  return {
    preFatigue: null,
    preMotivation: null,
    preRecovery: null,
    startMode: 'INTERACTIVE',
  };
}

export function startSessionPayloadFromMorningCheckin(scores: MorningCheckinScores | null): {
  preFatigue: null | number;
  preMotivation: null | number;
  preRecovery: null | number;
  startMode: 'INTERACTIVE';
} {
  if (!scores) {
    return skippedStartSessionPayload();
  }
  return {
    preFatigue: scaleFiveToTen(scores.sleep),
    preMotivation: scaleFiveToTen(scores.motivation),
    preRecovery: scaleFiveToTen(scores.recovery),
    startMode: 'INTERACTIVE',
  };
}

export function skippedFinishSessionPayload(): {
  comment: null;
  isIncomplete: false;
  postFatigue: null;
  postMood: null;
  postPain: null;
} {
  return {
    comment: null,
    isIncomplete: false,
    postFatigue: null,
    postMood: null,
    postPain: null,
  };
}
