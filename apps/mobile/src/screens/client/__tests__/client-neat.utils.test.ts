import { shouldShowClientNeatSection } from '../client-neat.utils';

describe('shouldShowClientNeatSection', () => {
  it('hides the section when there are no activities', () => {
    expect(shouldShowClientNeatSection(undefined)).toBe(false);
    expect(shouldShowClientNeatSection([])).toBe(false);
  });

  it('shows the section when the routine has NEAT activities', () => {
    expect(shouldShowClientNeatSection([{ id: 'n1', title: '10 000 pasos diarios', description: null }])).toBe(true);
  });
});
