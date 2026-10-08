import type { ChatCallProposal } from '../../data/hooks/useChat';

export type CallCardAction = 'accept' | 'counter';

/** Los botones aparecen solo cuando la propuesta está pendiente y le toca a quien mira. */
export function callCardActions(proposal: ChatCallProposal, viewerRole: 'COACH' | 'CLIENT'): CallCardAction[] {
  if (proposal.status !== 'pending' || proposal.lastProposedBy === viewerRole) return [];
  return ['accept', 'counter'];
}

export function callCardTone(proposal: ChatCallProposal): 'client' | 'coach' {
  return proposal.initiatedBy === 'CLIENT' ? 'client' : 'coach';
}

export const CALL_CARD_TONES = {
  client: { bg: '#3b0764', border: '#581c87' },
  coach: { bg: '#065f46', border: '#064e3b' },
} as const;

/** Cuartos de hora de 08:00 a 21:45, los mismos que admite la API. */
export function callTimeOptions(): string[] {
  const options: string[] = [];
  for (let minutes = 8 * 60; minutes <= 21 * 60 + 45; minutes += 15) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    options.push(`${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`);
  }
  return options;
}
