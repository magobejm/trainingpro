import { canSubmitFeedback } from '../feedback-category.utils';

describe('canSubmitFeedback', () => {
  it('needs the Ejercicio/Otros tag, with no default', () => {
    expect(canSubmitFeedback(null, 'Me dolió el hombro')).toBe(false);
  });

  it('needs some text', () => {
    expect(canSubmitFeedback('EXERCISE', '   ')).toBe(false);
  });

  it('allows either tag once there is text', () => {
    expect(canSubmitFeedback('EXERCISE', 'Pesaba mucho')).toBe(true);
    expect(canSubmitFeedback('OTHER', 'Llegué tarde')).toBe(true);
  });
});
