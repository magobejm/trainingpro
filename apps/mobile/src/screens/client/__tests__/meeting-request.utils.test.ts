import { buildMeetingRequestMessage } from '../meeting-request.utils';

describe('buildMeetingRequestMessage', () => {
  it('builds a prefilled meeting request with the date', () => {
    const message = buildMeetingRequestMessage('2026-10-02', (key, options) => `${key}:${options?.date}`);
    expect(message).toContain('client.calendar.detail.meetingRequestMessage');
    expect(message).toMatch(/octubre/i);
  });
});
