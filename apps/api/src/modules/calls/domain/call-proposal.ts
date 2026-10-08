export type CallParty = 'COACH' | 'CLIENT';

export const CALL_TIME_START_MINUTES = 8 * 60;
export const CALL_TIME_END_MINUTES = 21 * 60 + 45;
export const CALL_TIME_STEP_MINUTES = 15;

export function isValidCallTime(time: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return false;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (minutes < CALL_TIME_START_MINUTES || minutes > CALL_TIME_END_MINUTES) return false;
  return minutes % CALL_TIME_STEP_MINUTES === 0;
}

/** Solo puede responder la parte que no hizo la última propuesta. */
export function canRespondToProposal(actor: CallParty, lastProposedBy: CallParty): boolean {
  return actor !== lastProposedBy;
}
