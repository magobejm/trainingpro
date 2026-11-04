import { canSubmitFeedback } from '../feedback-category.utils';

describe('canSubmitFeedback', () => {
  it('needs some text', () => {
    expect(canSubmitFeedback('   ')).toBe(false);
  });

  it('allows the note once there is text, whichever label is selected', () => {
    expect(canSubmitFeedback('Pesaba mucho')).toBe(true);
  });
});
