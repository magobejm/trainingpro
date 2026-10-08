import { describe, expect, it } from 'vitest';
import type { ChatCallProposal } from '../../data/hooks/useChat';
import { callCardActions, callCardTone, callTimeOptions } from './call-proposal-card.logic';

const proposal: ChatCallProposal = {
  date: '2026-10-20',
  id: 'proposal-1',
  initiatedBy: 'COACH',
  lastProposedBy: 'COACH',
  proposedTime: '17:15',
  status: 'pending',
};

describe('callCardActions', () => {
  it('offers accept and counter only to the party that did not make the last proposal', () => {
    expect(callCardActions(proposal, 'CLIENT')).toEqual(['accept', 'counter']);
    expect(callCardActions(proposal, 'COACH')).toEqual([]);
  });

  it('hides the buttons once the call is accepted', () => {
    expect(callCardActions({ ...proposal, status: 'accepted' }, 'CLIENT')).toEqual([]);
  });

  it('follows the last proposal after a counter', () => {
    expect(callCardActions({ ...proposal, lastProposedBy: 'CLIENT' }, 'COACH')).toEqual(['accept', 'counter']);
  });
});

describe('callCardTone', () => {
  it('is green when the coach started it and purple when the client did', () => {
    expect(callCardTone(proposal)).toBe('coach');
    expect(callCardTone({ ...proposal, initiatedBy: 'CLIENT' })).toBe('client');
  });
});

describe('callTimeOptions', () => {
  it('lists quarter hours from 08:00 to 21:45', () => {
    const options = callTimeOptions();
    expect(options[0]).toBe('08:00');
    expect(options[options.length - 1]).toBe('21:45');
    expect(options).toContain('17:15');
    expect(options).not.toContain('09:10');
  });
});
