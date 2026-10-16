import { coachProgressParams } from '../coach-progress-query';

describe('coach progress API dates', () => {
  it('sends civil dates, without timestamps, as required by the API progress DTOs', () => {
    const params = coachProgressParams('client-id', '2026-07-18', '2026-10-16');
    expect(Object.fromEntries(params)).toEqual({ clientId: 'client-id', from: '2026-07-18', to: '2026-10-16' });
  });
});
