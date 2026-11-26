import { commitProfileMeasure, commitProfileNote, commitProfilePhone, commitProfileText } from '../client-profile-edit';

describe('commitProfileText', () => {
  it('keeps a trimmed name and ignores the same value', () => {
    expect(commitProfileText('Ana', ' Ana ', 80)).toEqual({ skip: true });
    expect(commitProfileText('Ana', 'Ana María', 80)).toEqual({ value: 'Ana María' });
  });

  it('rejects a blank name', () => {
    expect(commitProfileText('Ana', ' ', 80)).toEqual({ error: 'invalid' });
  });
});

describe('commitProfilePhone', () => {
  it('clears a blank phone and skips an unchanged one', () => {
    expect(commitProfilePhone('600', '  ')).toEqual({ value: null });
    expect(commitProfilePhone('600', '600')).toEqual({ skip: true });
  });
});

describe('commitProfileNote', () => {
  it('clears a blank note and skips an unchanged one', () => {
    expect(commitProfileNote('Polen', '  ')).toEqual({ value: null });
    expect(commitProfileNote('Polen', ' Polen ')).toEqual({ skip: true });
    expect(commitProfileNote(null, 'Rodilla')).toEqual({ value: 'Rodilla' });
  });
});

describe('commitProfileMeasure', () => {
  it('sends a measurement only when the stored value would change', () => {
    expect(commitProfileMeasure(170, 'heightCm', '170.2')).toEqual({ skip: true });
    expect(commitProfileMeasure(98, 'hipCm', '99')).toEqual({ value: 99 });
    expect(commitProfileMeasure(64, 'weightKg', '')).toEqual({ skip: true });
  });

  it('rejects a height outside the allowed range', () => {
    expect(commitProfileMeasure(170, 'heightCm', '40')).toEqual({ error: 'invalid' });
  });
});
