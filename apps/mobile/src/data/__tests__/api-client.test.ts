import { ApiClientError, isDayChangeConfirmationRequired } from '../api-client';

describe('isDayChangeConfirmationRequired', () => {
  it('detects the 409 confirmation code', () => {
    expect(isDayChangeConfirmationRequired(new ApiClientError('DAY_CHANGE_CONFIRMATION_REQUIRED', 409))).toBe(true);
    expect(isDayChangeConfirmationRequired(new ApiClientError('Unexpected API error', 409))).toBe(false);
    expect(isDayChangeConfirmationRequired(new ApiClientError('DAY_CHANGE_CONFIRMATION_REQUIRED', 400))).toBe(false);
  });
});
