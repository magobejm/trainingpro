import { canRespondToProposal, isValidCallTime } from '../../src/modules/calls/domain/call-proposal';

describe('isValidCallTime', () => {
  it.each(['08:00', '09:15', '21:45'])('acepta %s', (time) => {
    expect(isValidCallTime(time)).toBe(true);
  });

  it.each(['07:45', '21:46', '22:00', '09:10', '9:00', '0900'])('rechaza %s', (time) => {
    expect(isValidCallTime(time)).toBe(false);
  });
});

describe('canRespondToProposal', () => {
  it('no deja que nadie responda a su propia propuesta', () => {
    expect(canRespondToProposal('COACH', 'COACH')).toBe(false);
    expect(canRespondToProposal('CLIENT', 'CLIENT')).toBe(false);
  });

  it('deja responder a la otra parte', () => {
    expect(canRespondToProposal('CLIENT', 'COACH')).toBe(true);
    expect(canRespondToProposal('COACH', 'CLIENT')).toBe(true);
  });
});
